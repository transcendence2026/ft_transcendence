import { Injectable, BadRequestException, NotFoundException, ConflictException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service.js";

@Injectable()
export class PrivacyService {
	constructor(private readonly prisma: PrismaService) {}

	//Alternar Perfil Publico/Privado 
	//toggle profile visibility(public vs private)
	async updatePrivacy(userId: string, isPrivate: boolean) {
		const user = await this.prisma.user.update({
			where: { id: userId},
			data: { isPrivate},
			select: {
				id: true,
				username: true,
				isPrivate: true,
			},
		});
		return {
			status: 'UPDATED',
			user,
		};
	}

	//Bloquear a una persona
	//block a user
	async blockUser(blockerId: string, blockedId: string) {
		//prevent user from blocking themselves
		if( blockerId === blockedId) {
			throw new BadRequestException('You cannot block yourself');
		}
		//Verify if the user exists
		const targetUser = await this.prisma.user.findUnique({
			where: { id: blockedId },
		});
		if(!targetUser) {
			throw new NotFoundException('User to block not found');
		}
		//Check if the block relationship already exists
		//Para usar findUnique, tienes que darme la pareja completa (blockerId_blockedId),
		// porque solo juntos garantizan que el resultado sea una fila única".
		const existingBlock = await this.prisma.block.findUnique({
			where: {
				blockerId_blockedId: {
					blockerId,
					blockedId,
				},
			},
		});
		if(existingBlock) {
			throw new ConflictException('User is already blocked');
		}
		//Create a block record in database
		await this.prisma.block.create({
			data: {
				blockerId,
				blockedId,
			},
		});
		return {
			status: 'BLOCKED',
			message: `User ${targetUser.username} has been blocked successfully`,
		}
	}
	//Unblock a previously blocked user
	async unblockUser(blockerId: string, blockedId: string) {
		//Verify that the block exists
		const existingBlock = await this.prisma.block.findUnique({
			where: {
				blockerId_blockedId: {
					blockerId,
					blockedId,
				},
			},
		});
		if(!existingBlock) {
			throw new NotFoundException('Block relationship does not exist');
		}
		//Delete the block entry
		await this.prisma.block.delete({
			where: {
				blockerId_blockedId: {
					blockerId,
					blockedId,
				},
			},
		});
		return {
			status: 'UNBLOCKED',
			message: 'User has been unblocked successfully',
		};
	}
	//Retrieve list of users blocked by authenticated user
	async getBlockedUsers(userId: string) {
		const blockedEntries = await this.prisma.block.findMany({
			where: { blockerId: userId },
			include: {
				blocked: {
					select: {
						id: true,
						username: true,
						email: true,
						profile: {
							select: {
								avatarUrl: true,
							},
						},
					},
				},
			},
		});
		//Formt response payload for frontend consumption
		return blockedEntries.map((entry) => ({
			blockId: entry.id,
			user: {
				id: entry.blocked.id,
				username: entry.blocked.username,
				email: entry.blocked.email,
				avatarUrl: entry.blocked.profile?.avatarUrl ?? null,
			},
		}));
	}
}

