import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class RgpdService {
	constructor(private readonly prisma: PrismaService) {}
	
	//Art. 15 y 20 RGPD: Derecho de acceso y portabilidad
	//Extrae la informacion del usuario y su actividad
	async exportUserData(userId: string) {
		const user = await this.prisma.user.findUnique({
			where: { id: userId },
			select: { //select: seleccionas los datos en concreto que se pueden obtener (no todos)
				id: true,
				email: true,
				username: true,
				role: true,
				status: true,
				isPrivate: true,
				isTwoFactorEnabled: true,
				createdAt: true,
				updatedAt: true,

				//Perfil y preferencias gastronomicas
				profile: true,
				preference: true,

				//Peticiones de Amistades enviadas y recibidas
				sentFriendships: {
					select: {
						id: true,
						status: true,
						createdAt: true,
						receiver: { select: { id: true, username: true } },
					},
				},
				receivedFriendships: {
					select: {
						id: true,
						status: true,
						createdAt: true,
						sender: { select: { id: true, username: true } },
					},
				},

				//Bloqueos realizados por el usuario
				blockedUsers: {
					select: {
						id: true,
						createdAt: true,
						blocked: { select: { id: true, username: true } },
					},
				},
				
				//Publicaciones con sus imagenes
				posts: {
					select: {
                        id: true,
                        title: true,
                        content: true,
                        createdAt: true,
                        updatedAt: true,
                        images: {
                            select: {
                                id: true,
                                url: true,
                            },
                        },
                	},
				},

				//Reseñas (valoraciones y criticas) con el plato y restaurante asociado
				reviews: {
					select: {
						id: true,
						rating: true,
						comment: true,
						createdAt: true,
						dish: {
							select: {
								id: true,
								name: true,
								price: true,
								restaurant: { select: { id: true, name: true, cuisine: true } },
							},
						},
					},
				},

				//Mensajes directos enviados
				sentMessages: {
					select: {
						id: true,
						text: true,
						createdAt: true,
						receiverId: true,
					},
				},
			},
		});
		if (!user) {
      		throw new NotFoundException('Usuario no encontrado');
    	}

		//Estructura del archivo JSON de RGPD
		return {
			//Metadatos legales con sello de tiempo
      		exportMetadata: {
				platform: 'TasteSync',
				exportDate: new Date().toISOString(),
				regulation: 'RGPD (Reglamento General de Protección de Datos)',
				rightsExercised: 'Derecho de acceso y portabilidad (Art. 15 y 20)',
			},
			//Credenciales identificativas y estado de la configuracion de seguridad
			account: {
				id: user.id,
				email: user.email,
				username: user.username,
				role: user.role,
				isPrivate: user.isPrivate,
				isTwoFactorEnabled: user.isTwoFactorEnabled,
				createdAt: user.createdAt,
				updatedAt: user.updatedAt,
			},
			//Datos biograficos y gustos alimentarios
			profile: user.profile,
			gastronomicPreferences: user.preference,
			//Relaciones interpersonales (amistades y bloqueos)
			social: {
				sentFriendRequests: user.sentFriendships,
				receivedFriendRequests: user.receivedFriendships,
				blockedUsers: user.blockedUsers,
			},
			//Todo contenido generado por el usuario
			activity: {
				posts: user.posts,
				reviews: user.reviews,
				sentMessages: user.sentMessages,
			},
		};
	}
	// Art. 17 RGPD: Derecho de supresión de la cuenta / derecho al olvido
	//Elimina al usuario y a los datos asociados en cascada según Prisma
	async deleteUserAccount(userId: string) {
		//Primero comprueba con findUnique q la cuenta exista antes de intentar eliminarla
		const user = await this.prisma.user.findUnique({
			where: { id: userId },
		});
		if (!user) {
			throw new NotFoundException('Usuario no encontrado');
		}

		// Al tener 'onDelete: Cascade' definido en el schema.prisma para Profile, Posts, Reviews, etc.,
		// PostgreSQL borra en cascada el registro del User con toda su información personal.
		await this.prisma.user.delete({
			where: { id: userId },
		});
		//Retorna una confirmacion con marca de tiempo de cuando se ejecuto el borrado
		return {
			message: 'Cuenta y datos personales eliminados con éxito en cumplimiento del RGPD.',
			deletedAt: new Date().toISOString(),
		};
	}
}