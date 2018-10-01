const os = require('os');
const path = require('path');
let execs = {
    windows: "Desktop Application.exe",
    linux: "Desktop Application",
    mac: "Desktop Application.app"
}

export const repoOwner = 'gdprapp';
export const repoName = 'app';

export const platform = () => {
    if (os.platform().toLowerCase().indexOf('darwin') != -1) {
        return 'mac'
    } else if(os.platform().indexOf('win') != -1) {
        return 'windows'
    } else {
        return 'linux'
    }
} 

export const execPath = () => execs[platform()]

export const archiveType = '.zip'

export const appDir = platform() === 'windows' ? path.join(process.cwd(), '.dapp') : path.join(os.homedir(), '.dapp')