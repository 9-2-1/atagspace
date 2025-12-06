import * as db from './_db';
export * as tag from './tag';
export * as file from './file';

const transaction = db.db.transaction.bind(db.db);
export { transaction };
