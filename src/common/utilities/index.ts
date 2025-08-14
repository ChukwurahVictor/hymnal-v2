import {
  NotFoundException,
  BadRequestException,
  RequestTimeoutException,
  UnauthorizedException,
  ConflictException,
  Injectable,
} from '@nestjs/common';
import bcrypt from 'bcrypt';

@Injectable()
export class AppUtilities {
  public static comparePasswords(password: string, hash: string) {
    return bcrypt.compare(password, hash);
  }

  public static hashPassword(password: string, rounds = 10) {
    return bcrypt.hash(password, rounds);
  }

  public static handleException(error: any): Error {
    const errorCode: string = error.code;
    const message: string = error.meta
      ? error.meta.cause
        ? error.meta.cause
        : error.meta.field_name
          ? error.meta.field_name
          : error.meta.column
            ? error.meta.table
            : error.meta.table
      : error.message;
    switch (errorCode) {
      case 'P0000':
      case 'P2003':
      case 'P2004':
      case 'P2015':
      case 'P2018':
      case 'P2025':
        return new NotFoundException(message);
      case 'P2005':
      case 'P2006':
      case 'P2007':
      case 'P2008':
      case 'P2009':
      case 'P2010':
      case 'P2011':
      case 'P2012':
      case 'P2013':
      case 'P2014':
      case 'P2016':
      case 'P2017':
      case 'P2019':
      case 'P2020':
      case 'P2021':
      case 'P2022':
      case 'P2023':
      case 'P2026':
      case 'P2027':
        return new BadRequestException(message);
      case 'P2024':
        return new RequestTimeoutException(message);
      case 'P0001':
        return new UnauthorizedException(message);
      case 'P2002':
        const msg = `Conflict Exception: '${error.meta?.target?.[0]}' already exists!`;
        return new ConflictException(error.meta?.target?.[0] ? msg : message);
      default:
        console.error(message);
        if (!!message && message.toLocaleLowerCase().includes('arg')) {
          return new BadRequestException(
            'Invalid/Unknown field was found in the data set!',
          );
        } else {
          return error;
        }
    }
  }

  public static removeSensitiveData(data: any, deleteKeys: any, remove = true) {
    if (typeof data != 'object') return;
    if (!data) return;

    for (const key in data) {
      if (deleteKeys.includes(key)) {
        if (remove) {
          delete data[key];
        } else {
          data[key] = '******************';
        }
      } else {
        AppUtilities.removeSensitiveData(data[key], deleteKeys, remove);
      }
    }
    return data;
  }

  public static encode(
    data: string,
    encoding: BufferEncoding = 'base64',
  ): string {
    return Buffer.from(data).toString(encoding);
  }

  public static decode(
    data: string,
    encoding: BufferEncoding = 'base64',
  ): string {
    return Buffer.from(data, encoding).toString();
  }

  public static generatePassword(length = 8) {
    const characters =
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

    const digits = '0123456789';
    let generatedPassword = '';

    for (let i = 0; i < length - 2; i++) {
      const randomIndex = Math.floor(Math.random() * characters.length);
      generatedPassword += characters[randomIndex];
    }

    for (let i = 0; i < 2; i++) {
      const randomIndex = Math.floor(Math.random() * digits.length);
      generatedPassword += digits[randomIndex];
    }

    return generatedPassword;
  }

  public static slugify(text: string): string {
    return text
      .toLowerCase()
      .trim()
      .replace(/[\s]+/g, '-')
      .replace(/[^\w-]+/g, '');
  }
}
