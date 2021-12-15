// const winston = require('winston');
const { createLogger, format, transports, config}  = require('winston');
// const winstonRemoteTransport = require('winston-remote').Transport;

// const winstonRemote = require('winston-remote').Server;


let level, silent;

level = "debug";
silent = false;

/* TODO: fix this when app.env is setup */
// switch (process.env.NODE_ENV) {
//    case "production":
//       level = "debug";
//       silent = false;
//       break;
//    case "test":
//       level = "debug";
//       silent = true;
//       break;
//    default:
//       level = "debug";
//       silent = false;
//       break;
// }



const options = {
   console: {
      level,
      silent,
      handleExceptions: true,
      format: format.combine(
          format.colorize(),
          format.splat(),
          format.printf(
              info => `${new Date().toISOString()} ${info.level}: ${info.message}`,
          ),
      ),
   },
};

const SiphonLogger = createLogger({
   levels: config.syslog.levels,
   // transports: [
   //    new (winstonRemoteTransport)({
   //       host: '134.122.121.46', // Remote server ip
   //       port: 9003 // Remote server port
   //    })
   // ],
   transports: [new transports.Console(options.console)],
   exitOnError: false,
});


// function SiphonLogger(myapp_configuration) {
//    this.myapp_configuration = myapp_configuration;
//    this.logger = SiphonLogger;
//    return this.logger;
// }


module.exports = SiphonLogger;

/*const SiphonLogger = new (winston.Logger)({
   transports: [
      new (winstonRemoteTransport)({
         host: '134.122.121.46', // Remote server ip
         port: 9003 // Remote server port
      })
   ]
});

module.exports = SiphonLogger;*/
