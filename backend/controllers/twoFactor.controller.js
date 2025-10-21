const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const User = require('../models/User');
const crypto = require('crypto');

/**
 * Generate 2FA secret and QR code
 */
exports.generateTwoFactorSecret = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if 2FA is already enabled
    if (user.twoFactorEnabled) {
      return res.status(400).json({ message: '2FA is already enabled' });
    }

    // Generate secret
    const secret = speakeasy.generateSecret({
      name: `Beauty Marketplace (${user.email})`,
      issuer: 'Beauty Marketplace'
    });

    // Temporarily store secret (not enabled until verified)
    user.twoFactorSecret = secret.base32;
    await user.save();

    // Generate QR code
    const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url);

    res.json({
      secret: secret.base32,
      qrCode: qrCodeUrl,
      otpauthUrl: secret.otpauth_url
    });
  } catch (err) {
    console.error('Error generating 2FA secret:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Verify and enable 2FA
 */
exports.enableTwoFactor = async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ message: 'Token is required' });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!user.twoFactorSecret) {
      return res.status(400).json({ message: 'Please generate 2FA secret first' });
    }

    // Verify the token
    const verified = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token: token,
      window: 2
    });

    if (!verified) {
      return res.status(400).json({ message: 'Invalid token' });
    }

    // Generate backup codes
    const backupCodes = [];
    for (let i = 0; i < 10; i++) {
      backupCodes.push(crypto.randomBytes(4).toString('hex').toUpperCase());
    }

    // Enable 2FA
    user.twoFactorEnabled = true;
    user.twoFactorBackupCodes = backupCodes;
    await user.save();

    res.json({
      message: '2FA enabled successfully',
      backupCodes: backupCodes
    });
  } catch (err) {
    console.error('Error enabling 2FA:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Verify 2FA token during login
 */
exports.verifyTwoFactorToken = async (req, res) => {
  try {
    const { userId, token, isBackupCode } = req.body;

    if (!userId || !token) {
      return res.status(400).json({ message: 'User ID and token are required' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!user.twoFactorEnabled) {
      return res.status(400).json({ message: '2FA is not enabled for this user' });
    }

    let verified = false;

    if (isBackupCode) {
      // Check if backup code is valid
      const backupCodeIndex = user.twoFactorBackupCodes.indexOf(token.toUpperCase());
      if (backupCodeIndex !== -1) {
        // Remove used backup code
        user.twoFactorBackupCodes.splice(backupCodeIndex, 1);
        await user.save();
        verified = true;
      }
    } else {
      // Verify TOTP token
      verified = speakeasy.totp.verify({
        secret: user.twoFactorSecret,
        encoding: 'base32',
        token: token,
        window: 2
      });
    }

    if (!verified) {
      return res.status(400).json({ message: 'Invalid token' });
    }

    res.json({
      message: '2FA verification successful',
      verified: true
    });
  } catch (err) {
    console.error('Error verifying 2FA token:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Disable 2FA
 */
exports.disableTwoFactor = async (req, res) => {
  try {
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ message: 'Password is required' });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Verify password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid password' });
    }

    // Disable 2FA
    user.twoFactorSecret = null;
    user.twoFactorEnabled = false;
    user.twoFactorBackupCodes = [];
    await user.save();

    res.json({ message: '2FA disabled successfully' });
  } catch (err) {
    console.error('Error disabling 2FA:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Get 2FA status
 */
exports.getTwoFactorStatus = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('twoFactorEnabled twoFactorBackupCodes');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      enabled: user.twoFactorEnabled,
      backupCodesRemaining: user.twoFactorBackupCodes ? user.twoFactorBackupCodes.length : 0
    });
  } catch (err) {
    console.error('Error getting 2FA status:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Regenerate backup codes
 */
exports.regenerateBackupCodes = async (req, res) => {
  try {
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ message: 'Password is required' });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!user.twoFactorEnabled) {
      return res.status(400).json({ message: '2FA is not enabled' });
    }

    // Verify password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid password' });
    }

    // Generate new backup codes
    const backupCodes = [];
    for (let i = 0; i < 10; i++) {
      backupCodes.push(crypto.randomBytes(4).toString('hex').toUpperCase());
    }

    user.twoFactorBackupCodes = backupCodes;
    await user.save();

    res.json({
      message: 'Backup codes regenerated successfully',
      backupCodes: backupCodes
    });
  } catch (err) {
    console.error('Error regenerating backup codes:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Complete login after successful 2FA verification
 */
exports.completeTwoFactorLogin = async (req, res) => {
  const jwt = require('jsonwebtoken');
  
  try {
    const { userId, token, isBackupCode } = req.body;

    if (!userId || !token) {
      return res.status(400).json({ message: 'User ID and token are required' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!user.twoFactorEnabled) {
      return res.status(400).json({ message: '2FA is not enabled for this user' });
    }

    let verified = false;

    if (isBackupCode) {
      // Check if backup code is valid
      const backupCodeIndex = user.twoFactorBackupCodes.indexOf(token.toUpperCase());
      if (backupCodeIndex !== -1) {
        // Remove used backup code
        user.twoFactorBackupCodes.splice(backupCodeIndex, 1);
        await user.save();
        verified = true;
      }
    } else {
      // Verify TOTP token
      verified = speakeasy.totp.verify({
        secret: user.twoFactorSecret,
        encoding: 'base32',
        token: token,
        window: 2
      });
    }

    if (!verified) {
      return res.status(400).json({ message: 'Invalid token' });
    }

    // Generate JWT token after successful 2FA
    const payload = {
      user: {
        id: user.id,
        role: user.role
      }
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' },
      (err, jwtToken) => {
        if (err) {
          console.error('Error generating JWT:', err);
          return res.status(500).json({ message: 'Error generating token' });
        }

        res.json({
          token: jwtToken,
          user: {
            id: user.id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            role: user.role,
            twoFactorEnabled: user.twoFactorEnabled
          }
        });
      }
    );
  } catch (err) {
    console.error('Error completing 2FA login:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
};
