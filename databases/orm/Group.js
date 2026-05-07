import { DataTypes } from 'sequelize';
import sequelize from '../connector.js';

const Group = sequelize.define('Group', {
    jid: {
        type: DataTypes.STRING,
        primaryKey: true,
        allowNull: false
    },
    name: {
        type: DataTypes.STRING,
        allowNull: true
    },
    is_welcome: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    is_ban: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    }
}, {
    tableName: 'groups',
    timestamps: true
});

export default Group;
