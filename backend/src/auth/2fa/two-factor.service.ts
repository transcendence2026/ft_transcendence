import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js'; // Ajusta la ruta a tu PrismaService según tu estructura
import { generateSecret, generateURI, verify} from 'otplib';
import * as qrcode from 'qrcode';

@Injectable()
export class TwoFactorService {
	constructor(private readonly prisma: PrismaService) {}

		//GENERA el  SECRETO único y la imagen QR
	async generateTwoFactorSecret(userId: string, userEmail: string) {
		//generateSecret(): La librería otplib te devuelve un secreto aleatorio unico
		const secret = generateSecret();
		//damos nombre a la app, que aparecera en Google Authenticator
		const appName = 'Ft_Transcendence';
		//generateURI(...): La librería monta la URL con el formato otpauth://totp/... 
		//que une el email, la app y el secreto.
		const otpauthUrl = generateURI({
            issuer: appName,
            label: userEmail,
            secret: secret,
        });
		//buscamos al usuario por id y guardamos el código secreto en la BD (falta activar el 2FA)
		await this.prisma.user.update({
			where: { id: userId},
			data: { twoFactorSecret: secret},
		});
		// La librería qrcode convierte la URL anterior en una imagen digital
    	const qrCodeImage = await qrcode.toDataURL(otpauthUrl);
		//Devuelves un objeto JSON con el código secreto en texto y la imagen QR en base64
		// para que el usuario pueda escanearlo con su móvil.
		return {
		secret,
		qrCodeImage,
		};
	}

	//Tras escaner el QR se te genera un codigo de 6 digitos

	//Ahora toca validar y ACTIVAR el Doble Factor
	//recibes id y el codigo de 6 digitos y buscas al usuario en la BD
	async turnOnTwoFactor(userId: string, code: string) {
		const user = await this.prisma.user.findUnique({
			where: { id:userId },
		});
		if (!user || !user.twoFactorSecret) {
      		throw new UnauthorizedException('No 2FA secret has been configured previously');
    	}
		//authenticator.verify(...): La librería comprueba si el código de 6 dígitos (code) 
		//encaja matemáticamente con el secreto del usuario (user.twoFactorSecret)
		const isCodeValid = verify({
			token: code, //El token de 2FA: código de 6 dígitos que introdujo el usuario (code)
			secret: user.twoFactorSecret, //La llave secreta que teníamos guardada en la base de datos
		});
		if (!isCodeValid) {
      		throw new UnauthorizedException('Invalid verification code');
		}
		//Si es valido, se activa el doble factor
		return this.prisma.user.update({
			where: { id: userId },
			data: { isTwoFactorEnabled: true},
		});
	}
	// VERIFICAR EL CODIGO 6 DIGITOS introducido durante el login (o cuando sea necesario)
    async verifyCode(userId: string, code: string): Promise<boolean> {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
        });

        if (!user || !user.twoFactorSecret) {
            throw new UnauthorizedException('No 2FA secret configured for this user');
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
}
