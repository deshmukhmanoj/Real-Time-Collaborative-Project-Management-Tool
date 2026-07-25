// import { AuthUser } from './index';

// declare global {
//   namespace Express {
//     interface Request {
//       user?: AuthUser;
//       resourceBoardId?: number;
//     }
//   }
// }

// export {};
import type { AuthUser } from "./index";

export {};

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
      resourceBoardId?: number;
    }
  }
}