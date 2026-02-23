import { Controller } from '@nestjs/common';
import { SessionSecurityController } from './session.controller';

// Same logic, different prefix: /api/auth/*
@Controller('/api/auth')
export class SessionSecurityApiController extends SessionSecurityController {}
