import * as fs from 'fs';
import * as path from 'path';
import { execFileSync, execFile, exec, execSync } from 'child_process'
import { appDir, archiveType, platform, execPath } from '../config';
import { compareVersions, downloadApp, remakeDir, unzip } from '../utils'
import {
    app
} from 'electron'
import { getReleases } from './github'

export let latestVersion = null;
export let currentVersion = null;

export const runApp = () => {
    let version = fs.readFileSync(path.join(appDir, 'version')).toLocaleString();
    console.log("Running the app:", version);

    if (platform() === 'mac') {
        console.log(`open ${path.join(appDir, version, execPath())}`)
        exec(`open ${path.join(appDir, version, execPath()).replace(/ /gi, '\\ ')}`);
    } else {
        console.log('running ' + path.join(appDir, version, execPath()))
        execFile(path.join(appDir, version, execPath()))
    }
    if(app.dock) app.dock.hide()
}

export const updateApp = async (mainWindow) => {
    console.log(latestVersion)

    let assets = latestVersion.assets.filter(({
        name
    }) => {
        if (platform() === 'mac') {
            return name.indexOf('mac') != -1
        } else if (platform() === 'windows') {
            return name.indexOf('win') != -1
        } else {
            return name.indexOf('linux') != -1
        }
    });

    console.log(assets)
    let url = assets[0].browser_download_url;
    console.log('download init from', url)

    const versionDir = path.join(appDir, latestVersion.tag_name);
    const archiveFile = path.join(versionDir, 'app' + archiveType);

    await remakeDir(versionDir);

    downloadApp(url, archiveFile, p => {
        mainWindow.setProgressBar(p.percent);
        mainWindow.webContents.send('download-progress', p);
    })
        .then(() => {
            process.noAsar = true;
            unzip(archiveFile, versionDir).then(files => {
                process.noAsar = false;
                console.log('done!', files);
                mainWindow.close();
                currentVersion = latestVersion.tag_name;
                fs.writeFileSync(path.join(appDir, 'version'), latestVersion.tag_name);
                runApp()
            });
        })
};

export const checkUpdate = () => {
    console.log('checking update');
    return getReleases().then(releases => {
        console.log("Got releases")
        releases.forEach(r => {
            console.log(currentVersion, r.tag_name)
            if (compareVersions(currentVersion, r.tag_name) == -1) {
                console.log('Found ' + r.tag_name)
                if (latestVersion == null) {
                    latestVersion = r;
                } else {
                    if (compareVersions(latestVersion.tag_name, r.tag_name) == -1) {
                        latestVersion = r;
                    }
                }
            }
        });
        if (latestVersion) console.log('Latest version: ' + latestVersion.tag_name, 'Current :' + currentVersion);
        return !!latestVersion
    })
}

export const initialize = () => {
    if (!fs.existsSync(appDir)) {
        fs.mkdirSync(appDir);
        fs.writeFileSync(path.join(appDir, 'version'), 'v0.0.0');
    }
    let version = fs.readFileSync(path.join(appDir, 'version')).toLocaleString();
    currentVersion = version;
};