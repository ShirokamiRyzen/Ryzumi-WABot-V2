import { DataTypes } from 'sequelize';
import sequelize from '../connector.js';

const Setting = sequelize.define('Setting', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    is_public: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
    },
    is_register: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
    }
}, {
    tableName: 'settings',
    timestamps: true,
});

export default Setting;
