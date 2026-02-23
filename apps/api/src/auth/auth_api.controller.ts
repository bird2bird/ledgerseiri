import { Controller } from '@nestjs/common';
import { AuthController } from './auth.controller';

// Keep ONE logic for login/register/me under both prefixes.
// /auth/*  and  /api/auth/*
@Controller('api/auth')
export class AuthApiController extends AuthController {}
