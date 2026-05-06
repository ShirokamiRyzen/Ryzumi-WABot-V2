import { DataTypes } from 'sequelize';
import sequelize from '../connector.js';

const User = sequelize.define('User', {
    jid: {
        type: DataTypes.STRING,
        primaryKey: true,
    },
    name: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    is_premium: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
    },
    is_banned: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
    },
    limit: {
        type: DataTypes.INTEGER,
        defaultValue: 10,
    },
    is_registered: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
    }
}, {
    tableName: 'users',
    timestamps: true, // Secara otomatis akan membuat kolom createdAt dan updatedAt (sebagai timestamp)
});

export default User;
