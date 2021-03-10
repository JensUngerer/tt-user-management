import CryptoJS from 'crypto-js';
import inquirer from 'inquirer';
import { IUserData } from './i-user-data';
import mongoose, { Connection } from 'mongoose';
import { Logger } from './common/logger';

export class App {

  // @ts-ignore
  private connection: Connection;

  private closeConnection()  {
    if (this.connection) {
      const connectionClosedPromise = this.connection.close();
      connectionClosedPromise.then(() =>  {
        Logger.log('Connection successfully closed');
      });
      connectionClosedPromise.catch((errerConnectionClosed: any) =>  {
        Logger.log('Connection closing error:', errerConnectionClosed);
      });
    }
  }

  constructor() {
    // https://nodejs.org/api/process.html#process_signal_events
    const graceFulShutdown = () => {
      this.closeConnection();
    };
    const SIGINT = 'SIGINT';
    const sigIntCallback = () => {
      process.off(SIGINT, sigIntCallback);
      graceFulShutdown();
    };
    process.on(SIGINT, sigIntCallback);

    const SIGHUP = 'SIGHUP';
    const sigHupCallback = () => {
      process.off(SIGHUP, sigHupCallback);
      graceFulShutdown();
    };
    process.on(SIGHUP, sigHupCallback);
  }

  storeUserDataInDataBase(userData: IUserData) {
    const completeDataBaseString = process.env.DATA_BASE_STRING + '/' + process.env.DATA_BASE_NAME;

    this.connection = mongoose.createConnection(completeDataBaseString, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      // user: process.env.DATA_BASE_USER_NAME,
      // pass: process.env.DATA_BASE_PASSWORD
    });

    const UserSchema = new mongoose.Schema({
      username: String,
      hash: String
    });

    const User = this.connection.model('User', UserSchema);
    const newUser = new User({
      username: userData.email,
      hash: userData.passwordHash,
    });

    const newUserPromise = newUser.save()
    newUserPromise.then(() => {
      Logger.log('User successfully created');

      this.closeConnection();
    });
    newUserPromise.catch((err: any) => {
      Logger.log('Error when creating user');
      Logger.log(err);

      this.closeConnection();
    });
  }

  static run(): App {
    const app = new App();
    return app;
  }

  private requireLetterAndNumber(value: string) {
    if (/\w/.test(value) && /\d/.test(value)) {
      return true;
    }

    return 'Password need to have at least a letter and a number';
  }

  public async getUserDataViaCommandLineInterface() {
    let answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'email',
        message: 'Email:'
      },
      {
        type: 'password',
        message: 'Password:',
        name: 'password',
        mask: '*',
        validate: this.requireLetterAndNumber.bind(this)
      }
    ]);
    const passwordHash = CryptoJS.SHA512(answers.password).toString();
    const userData: IUserData = {
      email: answers.email,
      passwordHash: passwordHash
    };
    answers = null;
    return userData;
  }
}
