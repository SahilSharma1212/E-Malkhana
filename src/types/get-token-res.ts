export interface UserResInterface {
  email: string;
  name: string;
  thana: string;
  role: string;
}

export interface TokenResInterface {
  authenticated: boolean;
  user: UserResInterface;
}
