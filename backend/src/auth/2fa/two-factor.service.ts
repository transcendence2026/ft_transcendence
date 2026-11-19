import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { generateSecret, generateURI, verify} from 'otplib';
import * as qrcode from 'qrcode';

@Injectable()
export class TwoFactorService {
	constructor(private readonly prisma: PrismaService) {}

		//generate the unique secret and the QR image
	async generateTwoFactorSecret(userId: string, userEmail: string) {
		//generateSecret(): The otplib library returns an unique, random secret.
		const secret = generateSecret();
		//We give the app a name, which will appear in Google Authenticator.
		const appName = 'Ft_Transcendence';
		//generateURI(...): The library constructs the URL using the otpauth://totp/... format, 
		//which combines the email, the app, and the secret.
		const otpauthUrl = generateURI({
            issuer: appName,
            label: userEmail,
            secret: secret,
        });
		//We look up the user by ID and save the secret code to the database (2FA still needs to be activated).
		await this.prisma.user.update({
			where: { id: userId},
			data: { twoFactorSecret: secret},
		});
		// The qrcode library converts the URL above into a digital image.
    	const qrCodeImage = await qrcode.toDataURL(otpauthUrl);
		//Return a JSON object containing the secret code in text and in QR image
		// so that the user can scan it or enter the secret manually
		return {
		secret,
		qrCodeImage,
		};
	}

	//After scanning the QR code, a 6-digit code is generated for you.
	//Now it’s time to validate and ACTIVATE Two-Factor Authentication
	async turnOnTwoFactor(userId: string, code: string) {
		const user = await this.prisma.user.findUnique({
			where: { id:userId },
		});
		if (!user || !user.twoFactorSecret) {
      		throw new UnauthorizedException('No 2FA secret has been configured previously');
    	}
		//authenticator.verify(...): // The library checks if the 6-digit code mathematically matches the user's secret
		const isCodeValid = verify({
			token: code,
			secret: user.twoFactorSecret,
		});
		if (!isCodeValid) {
      		throw new UnauthorizedException('Invalid verification code');
		}
		//If it is valid, two-factor authentication is activated.
		return this.prisma.user.update({
			where: { id: userId },
			data: { isTwoFactorEnabled: true},
		});
	}
	// VERIFY THE 6-DIGIT CODE entered during login (or whenever necessary)
    async verifyCode(userId: string, code: string): Promise<boolean> {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
        });

        if (!user || !user.twoFactorSecret) {
            throw new UnauthorizedException('No 2FA secret configured for this user');
        }
		
		//We require the code to be 6 digits long.
		if (!code || !/^\d{6}$/.test(code)) {
			throw new UnauthorizedException('Invalid 2FA code format');
		}

        const isCodeValid = verify({
            token: code,
            secret: user.twoFactorSecret,
        });

        if (!isCodeValid) {
            throw new UnauthorizedException('Invalid 2FA code');
        }

        return true;
    }

	//Function to disable 2FA, requiring a 6-digit confirmation code
	async turnOffTwoFactor(userId: string, code: string) {
		const user = await this.prisma.user.findUnique({
			where: { id:userId},
		});
		if (!user || !user.twoFactorSecret) {
      		throw new UnauthorizedException('No 2FA secret has been configured previously');
    	}
		if(!user.isTwoFactorEnabled) {
			throw new UnauthorizedException('2FA is not enabled for this user');
		}
		const isCodeValid = verify({
			token: code,
			secret: user.twoFactorSecret,
		});
		if (!isCodeValid) {
      		throw new UnauthorizedException('Invalid verification code');
		}
		//If it is valid, then we disable 2FA and clear the secret
		return this.prisma.user.update({
			where: { id: userId },
			data: { 
				isTwoFactorEnabled: false,
				twoFactorSecret: null,
			},
		});
	}
}
