import * as db from './_db';
import * as file from './file';

const transaction = db.db.transaction.bind(db.db);
export { transaction, file };
