import dotenv from 'dotenv';
dotenv.config();

const config = {
  // Bot Config
  BOT_NUMBER: process.env.BOT_NUMBER,
  OWNER_NUMBER: process.env.OWNER_NUMBER,
  PORT: process.env.PORT,

  // Database Config
  DB_DRIVER: process.env.DB_DRIVER, // Options: mariadb, mysql, sqlite3
  DB_HOST: process.env.DB_HOST,
  DB_PORT: process.env.DB_PORT,
  DB_NAME: process.env.DB_NAME,
  DB_USER: process.env.DB_USER,
  DB_PASS: process.env.DB_PASS,

  // Nextcloud Config
  NEXTCLOUD_URL: process.env.NEXTCLOUD_URL,
  NEXTCLOUD_USER: process.env.NEXTCLOUD_USER,
  NEXTCLOUD_PASSWORD: process.env.NEXTCLOUD_PASSWORD,
  NEXTCLOUD_PATH: process.env.NEXTCLOUD_PATH,

  // Bot Watermark
  BOT_NAME: process.env.BOT_NAME,

  // Social Media
  SOC_FACEBOOK: process.env.SOC_FACEBOOK,
  SOC_INSTAGRAM: process.env.SOC_INSTAGRAM,
  SOC_GITHUB: process.env.SOC_GITHUB,
  SOC_WA_GROUP: process.env.SOC_WA_GROUP,
  SOC_WEBSITE: process.env.SOC_WEBSITE,

  // Payment Config
  PAY_QRIS: process.env.PAY_QRIS,

  // API Service
  API_RYZUMI: process.env.API_RYZUMI,

  // Image Link
  RYZUMI_DEFAULT_PP: process.env.RYZUMI_DEFAULT_PP,
  RYZUMI_BANNER: process.env.RYZUMI_BANNER,
  RYZUMI_WELCOME_BANNER: process.env.RYZUMI_WELCOME_BANNER,
  RYZUMI_LEAVE_BANNER: process.env.RYZUMI_LEAVE_BANNER,

  // Ryzumi Message
  RYZUMI_MSG_REGISTER: process.env.RYZUMI_MSG_REGISTER,
  RYZUMI_MSG_DISABLE: process.env.RYZUMI_MSG_DISABLE,
  RYZUMI_MSG_GROUP: process.env.RYZUMI_MSG_GROUP,
  RYZUMI_MSG_PRIVATE: process.env.RYZUMI_MSG_PRIVATE,
  RYZUMI_MSG_LIMIT: process.env.RYZUMI_MSG_LIMIT,
  RYZUMI_MSG_COOLDOWN: process.env.RYZUMI_MSG_COOLDOWN,
  RYZUMI_MSG_OWNER: process.env.RYZUMI_MSG_OWNER,
  RYZUMI_MSG_MODERATOR: process.env.RYZUMI_MSG_MODERATOR,
  RYZUMI_MSG_BOTADMIN: process.env.RYZUMI_MSG_BOTADMIN,
  RYZUMI_MSG_ADMIN: process.env.RYZUMI_MSG_ADMIN,
  RYZUMI_MSG_QUOTED: process.env.RYZUMI_MSG_QUOTED,
  RYZUMI_MSG_PREMIUM: process.env.RYZUMI_MSG_PREMIUM,
};

export default config;
