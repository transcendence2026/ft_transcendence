import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-42';
import { Injectable } from '@nestjs/common';

@Injectable()
export class FortyTwoStrategy extends PassportStrategy(Strategy, '42') {
  constructor() {
    super({
      clientID: process.env.FORTY_TWO_CLIENT_ID,   // Las credenciales de tu app registrada en la API
      clientSecret: process.env.FORTY_TWO_CLIENT_SECRET,
      callbackURL: process.env.FORTY_TWO_REDIRECT_URI || 'https://localhost:8443/api/auth/oauth/42/callback',  // A dónde vuelve tras loguearse
      scope: ['public'],  // Qué permisos pides (ej: leer su perfil)
    });
  }

  //Este método se ejecuta AUTOMÁTICAMENTE cuando el proveedor externo nos da luz verde
  //Una vez que el usuario se autentica en la plataforma
  //esta le devuelve un paquete de datos llamado profile (que trae los datos del usuario que nos mandó la API externa)
  //validate intercepta ese paquete, lo abre, saca lo que te importa (como su correo y su apodo) 
  //y se lo entrega al servicio de autenticación 
  //para que el sistema genere el token JWT interno de TasteSync.
  async validate(accessToken: string, refreshToken: string, profile: any): Promise<any> {
    const { username, emails, image } = profile;
    // Devolvemos un objeto limpio con los datos que nos interesan (no todos los q tiene profile)
    return {
      email: emails && emails.length > 0 ? emails[0].value : `${username}@student.42malaga.com`,
      username: username,
      avatarUrl: image?.link || '',
    };
  }
}
