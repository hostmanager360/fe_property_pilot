export class ResponseHandler<T> {
  code: number;
  type: 'SUCCESS' | 'ERROR';
  message: string;
  data: T | null;

  constructor(
    code: number = 200,
    type: 'SUCCESS' | 'ERROR' = 'SUCCESS',
    message: string = '',
    data: T | null = null
  ) {
    this.code = code;
    this.type = type;
    this.message = message;
    this.data = data;
  }
}
