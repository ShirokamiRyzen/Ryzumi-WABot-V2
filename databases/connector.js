import { Sequelize } from 'sequelize';
import config from '../config.js';

let sequelize;

if (config.DB_DRIVER === 'sqlite3') {
    sequelize = new Sequelize({
        dialect: 'sqlite',
        storage: './databases/ryzumi_wa.sqlite',
        logging: false
    });
} else {
    // Default to mariadb/mysql
    sequelize = new Sequelize(config.DB_NAME, config.DB_USER, config.DB_PASS, {
        host: config.DB_HOST,
        port: config.DB_PORT,
        dialect: config.DB_DRIVER === 'mariadb' ? 'mariadb' : 'mysql',
        logging: false
    });
}

export default sequelize;
