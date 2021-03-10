import { App } from './app/app';
import { IUserData } from './app/i-user-data';
import dotenv from 'dotenv';

dotenv.config();
const app = App.run();

const userDataPromise = app.getUserDataViaCommandLineInterface();
userDataPromise.then((userData: IUserData) =>  {
    app.storeUserDataInDataBase(userData);
});
