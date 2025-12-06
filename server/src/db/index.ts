import * as db from './_db';
export * as file from './file';
export * as tag from './tag';

const transaction = db.db.transaction.bind(db.db);
export { transaction };
