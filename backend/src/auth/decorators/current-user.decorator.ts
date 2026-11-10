import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import { UserPayload } from "../interfaces/user-payload.interface.js";

// @CurrentUser() to extract the authenticated user data (req.user) 
// and inject it into controller route handlers.
export const CurrentUser = createParamDecorator(
	(data: unknown, ctx: ExecutionContext) : UserPayload => {
		const request = ctx.switchToHttp().getRequest();
    	return request.user;
	},
);