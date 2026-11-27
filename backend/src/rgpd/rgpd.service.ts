import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class RgpdService {
	constructor(private readonly prisma: PrismaService) {}
	
	// GDPR Art. 15 & 20: Right of access and data portability.
    // Extracts user personal data, profile settings, social connections, and user-generated content
	async exportUserData(userId: string) {
		const user = await this.prisma.user.findUnique({
			where: { id: userId },
			select: { // Select only the specific fields permitted for export (excluding passwordHash, secrets, etc.)
				id: true,
				email: true,
				username: true,
				role: true,
				status: true,
				isPrivate: true,
				isTwoFactorEnabled: true,
				createdAt: true,
				updatedAt: true,

				//Profile details and food/dietary preferences
				profile: true,
				preference: true,

				// Friend requests sent and received
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

				// User blocklist entries
				blockedUsers: {
					select: {
						id: true,
						createdAt: true,
						blocked: { select: { id: true, username: true } },
					},
				},
				
				// Authored posts and related images
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

				// Authored reviews with dish and restaurant context
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

				// Direct messages sent by the user
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
      		throw new NotFoundException('User not found');
    	}

		// Standardized GDPR JSON export payload
		return {
      		exportMetadata: {
				platform: 'TasteSync',
				exportDate: new Date().toISOString(),
				regulation: 'GDPR (General Data Protection Regulation)',
				rightsExercised: 'Right of access and data portability (Art. 15 & 20)',
			},
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
			// Biographical information and culinary preferences
			profile: user.profile,
			gastronomicPreferences: user.preference,
			// Interpersonal connections (friendships and blocks)
			social: {
				sentFriendRequests: user.sentFriendships,
				receivedFriendRequests: user.receivedFriendships,
				blockedUsers: user.blockedUsers,
			},
			// User-generated content and activity
			activity: {
				posts: user.posts,
				reviews: user.reviews,
				sentMessages: user.sentMessages,
			},
		};
	}
	
	// GDPR Art. 17: Right to erasure ('right to be forgotten').
    // Deletes the user record; cascading rules configured in schema.prisma remove all dependent relations
	async deleteUserAccount(userId: string) {
		const user = await this.prisma.user.findUnique({
			where: { id: userId },
		});
		if (!user) {
			throw new NotFoundException('User not found');
		}

		// Database cascade deletes associated records (profile, posts, reviews, friendships, blocks)
		await this.prisma.user.delete({
			where: { id: userId },
		});
		return {
			message: 'Account and personal data successfully deleted in compliance with GDPR.',
			deletedAt: new Date().toISOString(),
		};
	}
}