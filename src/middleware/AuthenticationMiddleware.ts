import { Context, Next } from 'koa';
import { Connection } from 'typeorm';
import { UNAUTHORIZED } from 'http-status-codes';

import SecurityService, { Claims } from '../services/SecurityService';
import UserRepository from '../repositories/UserRepository';
import { User } from '../entities/User';

export default function ({
	connection,
	securityService,
}: {
	connection: Connection;
	securityService: SecurityService;
}) {
	return async function (ctx: Context, next: Next) {
		const { authorization }: { authorization: string } = ctx.header;

		if (!authorization) {
			ctx.throw(UNAUTHORIZED, 'Unauthorized');
		}

		const [tokenType, token]: string[] = authorization.split(' ');

		if (tokenType.toLowerCase() !== 'bearer' && tokenType.toLowerCase() !== 'token') {
			ctx.throw(UNAUTHORIZED, 'Unauthorized');
		}

		let claims: Claims;
		try {
			claims = securityService.verifyToken(token);
		} catch {
			ctx.throw(UNAUTHORIZED, 'Unauthorized');
		}

		const userRepository: UserRepository = connection.getCustomRepository(UserRepository);
		const user: User | undefined = await userRepository.findOne(claims.id);
		if (!user) {
			ctx.throw(UNAUTHORIZED, 'Unauthorized');
		}
		ctx.state.user = user;
		ctx.state.token = token;
		return next();
	};
}