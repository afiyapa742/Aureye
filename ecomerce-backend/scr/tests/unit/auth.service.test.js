
const authService = require('../../services/user');
const userRepositories = require('../../repositories/userrepositories');
const bcrypt = require('bcrypt');
const generateOtp = require('../../utils/generateOtp');
const sendOtpEmail = require('../../utils/sendEmail');

jest.mock('../../repositories/userrepositories');
jest.mock('bcrypt');
jest.mock('../../utils/generateOtp');
jest.mock('../../utils/sendEmail');

describe('registerUser', () => {
  test('should throw 409 if user already exists', async () => {
    userRepositories.findByEmail.mockResolvedValue({ email: 'test@example.com' });

    await expect(
      authService.registerUser({ FullName: 'Test', email: 'test@example.com', password: '123456', MobileNumber: '9876543210' })
    ).rejects.toThrow('User already exists');
  });

  test('should create user and send OTP if email is new', async () => {
    userRepositories.findByEmail.mockResolvedValue(null);
    bcrypt.hash.mockResolvedValue('hashedpassword');
    generateOtp.mockReturnValue('123456');
    userRepositories.createUser.mockResolvedValue({ email: 'new@example.com' });
    sendOtpEmail.mockResolvedValue(true);

    const result = await authService.registerUser({
      FullName: 'New User', email: 'new@example.com', password: '123456', MobileNumber: '9876543210',
    });

    expect(userRepositories.createUser).toHaveBeenCalled();
    expect(result.email).toBe('new@example.com');
  });
});

describe('loginUser', () => {
  test('should throw 401 if user does not exist', async () => {
    userRepositories.findByEmail.mockResolvedValue(null);

    await expect(
      authService.loginUser({ email: 'notfound@example.com', password: '123456' })
    ).rejects.toThrow('Invalid credentials');
  });

  test('should throw 403 if not verified', async () => {
    userRepositories.findByEmail.mockResolvedValue({ isVerified: false });

    await expect(
      authService.loginUser({ email: 'test@example.com', password: '123456' })
    ).rejects.toThrow('Please verify your email before logging in');
  });

  test('should throw 401 if password is wrong', async () => {
    userRepositories.findByEmail.mockResolvedValue({ isVerified: true, password: 'hashed' });
    bcrypt.compare.mockResolvedValue(false);

    await expect(
      authService.loginUser({ email: 'test@example.com', password: 'wrongpassword' })
    ).rejects.toThrow('Invalid credentials');
  });

  test('should return token on success', async () => {
    userRepositories.findByEmail.mockResolvedValue({
      isVerified: true, password: 'hashed', _id: '1', FullName: 'A', email: 'test@example.com', MobileNumber: '123',
    });
    bcrypt.compare.mockResolvedValue(true);

    const result = await authService.loginUser({ email: 'test@example.com', password: '123456' });

    expect(result.token).toBeDefined();
  });
});