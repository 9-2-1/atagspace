import { APIproxy } from '../server/src/utils/apiproxy/client';
import type { APIType } from '../server/src/index';
export type { CategoryTag } from '../server/src/api/tag/category';
export type { Tag } from '../server/src/db/tag';
export type { FileTag } from '../server/src/api/file';
export const API = APIproxy('/api') as APIType;
