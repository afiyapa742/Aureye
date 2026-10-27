const profilerepository = require('../../repositories/profilerepositories');
const addressrepository = require('../../repositories/addressrepositories');
const mailer = require('../../utils/mailer');
const profileService = require('../../services/profileservice');

// Auto-mock the modules profileservice depends on
jest.mock('../repositories/profilerepositories');
jest.mock('../repositories/addressrepositories');
jest.mock('../utils/mailer');

const mockUser = {
  _id: 'user1',
  FullName: 'Alice Example',
  email: 'alice@old.com',
  MobileNumber: '9999999999',
  profileImage: null,
  AuthProvider: 'local',
  status: 'active',
  pendingEmail: null,
  emailChangeOtp: null,
  emailChangeOtpExpiry: null,
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe('getProfile', () => {
  it('returns user fields merged with addresses', async () => {
    profilerepository.findById.mockResolvedValue(mockUser);
    addressrepository.findAllByUserId.mockResolvedValue([
      { _id: 'addr1', city: 'Kochi' },
    ]);

    const result = await profileService.getProfile('user1');

    expect(result.email).toBe('alice@old.com');
    expect(result.addresses).toHaveLength(1);
    expect(result.addresses[0].city).toBe('Kochi');
    expect(profilerepository.findById).toHaveBeenCalledWith('user1');
  });

  it('throws 404 when user does not exist', async () => {
    profilerepository.findById.mockResolvedValue(null);

    await expect(profileService.getProfile('ghost')).rejects.toMatchObject({
      message: 'User not found',
      statusCode: 404,
    });

    expect(addressrepository.findAllByUserId).not.toHaveBeenCalled();
  });
});

describe('updateProfile', () => {
  it('only forwards allowed fields to the repository', async () => {
    profilerepository.updateById.mockResolvedValue({
      ...mockUser,
      FullName: 'Alice Updated',
    });

    const result = await profileService.updateProfile('user1', {
      FullName: 'Alice Updated',
      email: 'sneaky@new.com', // should be stripped out
      isAdmin: true, // should be stripped out
    });

    expect(profilerepository.updateById).toHaveBeenCalledWith('user1', {
      FullName: 'Alice Updated',
    });
    expect(result.FullName).toBe('Alice Updated');
  });

  it('throws 404 when user does not exist', async () => {
    profilerepository.updateById.mockResolvedValue(null);

    await expect(
      profileService.updateProfile('ghost', { FullName: 'X' })
    ).rejects.toMatchObject({ statusCode: 404 });
  });
});

describe('requestEmailChange', () => {
  it('rejects when new email matches current email', async () => {
    profilerepository.findById.mockResolvedValue(mockUser);

    await expect(
      profileService.requestEmailChange('user1', 'alice@old.com')
    ).rejects.toMatchObject({ statusCode: 400 });

    expect(profilerepository.updateById).not.toHaveBeenCalled();
    expect(mailer.sendMail).not.toHaveBeenCalled();
  });

  it('rejects when email is already taken by another user', async () => {
    profilerepository.findById.mockResolvedValue(mockUser);
    profilerepository.findByEmail.mockResolvedValue({ _id: 'user2' });

    await expect(
      profileService.requestEmailChange('user1', 'taken@example.com')
    ).rejects.toMatchObject({ statusCode: 409 });

    expect(mailer.sendMail).not.toHaveBeenCalled();
  });

  it('stores OTP and pending email, then sends mail to the NEW address', async () => {
    profilerepository.findById.mockResolvedValue(mockUser);
    profilerepository.findByEmail.mockResolvedValue(null);
    profilerepository.updateById.mockResolvedValue({});

    const result = await profileService.requestEmailChange('user1', 'alice@new.com');

    expect(result.message).toBe('OTP sent to new email address');

    // check repository was updated with pendingEmail + otp fields
    const updateArgs = profilerepository.updateById.mock.calls[0][1];
    expect(updateArgs.pendingEmail).toBe('alice@new.com');
    expect(updateArgs.emailChangeOtp).toMatch(/^\d{6}$/);
    expect(updateArgs.emailChangeOtpExpiry).toBeInstanceOf(Date);

    // check mail was sent to the NEW email, not the old one
    expect(mailer.sendMail).toHaveBeenCalledWith(
      'alice@new.com',
      expect.any(String),
      expect.stringContaining(updateArgs.emailChangeOtp)
    );
  });

  it('throws 404 when user does not exist', async () => {
    profilerepository.findById.mockResolvedValue(null);

    await expect(
      profileService.requestEmailChange('ghost', 'x@y.com')
    ).rejects.toMatchObject({ statusCode: 404 });
  });
});

describe('verifyEmailChange', () => {
  const pendingUser = {
    ...mockUser,
    pendingEmail: 'alice@new.com',
    emailChangeOtp: '123456',
    emailChangeOtpExpiry: new Date(Date.now() + 10 * 60 * 1000), // 10 min from now
  };

  it('throws 404 when user does not exist', async () => {
    profilerepository.findById.mockResolvedValue(null);

    await expect(
      profileService.verifyEmailChange('ghost', '123456')
    ).rejects.toMatchObject({ statusCode: 404 });
  });

  it('throws 400 when there is no pending email change', async () => {
    profilerepository.findById.mockResolvedValue(mockUser); // no pendingEmail

    await expect(
      profileService.verifyEmailChange('user1', '123456')
    ).rejects.toMatchObject({
      statusCode: 400,
      message: 'No pending email change request',
    });
  });

  it('throws 400 when OTP has expired', async () => {
    profilerepository.findById.mockResolvedValue({
      ...pendingUser,
      emailChangeOtpExpiry: new Date(Date.now() - 1000), // in the past
    });

    await expect(
      profileService.verifyEmailChange('user1', '123456')
    ).rejects.toMatchObject({
      statusCode: 400,
      message: 'OTP has expired',
    });
  });

  it('throws 400 when OTP does not match', async () => {
    profilerepository.findById.mockResolvedValue(pendingUser);

    await expect(
      profileService.verifyEmailChange('user1', '000000')
    ).rejects.toMatchObject({
      statusCode: 400,
      message: 'Invalid OTP',
    });
  });

  it('swaps email and clears OTP fields on success', async () => {
    profilerepository.findById.mockResolvedValue(pendingUser);
    profilerepository.updateById.mockResolvedValue({
      ...pendingUser,
      email: 'alice@new.com',
      pendingEmail: null,
      emailChangeOtp: null,
      emailChangeOtpExpiry: null,
    });

    const result = await profileService.verifyEmailChange('user1', '123456');

    expect(profilerepository.updateById).toHaveBeenCalledWith('user1', {
      email: 'alice@new.com',
      pendingEmail: null,
      emailChangeOtp: null,
      emailChangeOtpExpiry: null,
    });
    expect(result.email).toBe('alice@new.com');
  });
});