---
title: "MacOS renting and development in the cloud"
date: 2022-01-19T18:00:00+00:00
draft: false
type: "default"
layout: "post_layout_default"
enable_comments: true

authors:
    - "riccardobl"

tags:
    - "tutorials"
    - "blog"
    - "misc"
---

![Screenshot_20220119_143808](https://user-images.githubusercontent.com/4943530/150141802-2e082357-7422-4405-b066-88947bf28642.png)

MacOS cloud renting has started to proliferate with the new Apple Silicon M1 chip and it turned out to be a pretty decent way to test graphical applications on MacOS without buying apple's pricey hardware or resorting to hackish ports and vms of questionable legality.

I am reporting here the procedure to quickly get a MacOS M1 cloud service up and running for testing jmonkey applications without too much hassle.

This guide focus on Apple Silicon M1 instances, but can be replicated on x86_64

### 1. Finding the right cloud provider
Firstly you are going to need to find a place where you can rent your cloud server.
We are going to need ssh, root and vnc access.
I've been using  https://www.scaleway.com/en/hello-m1/ with success. It is located in Paris, so people outside europe might want to find a local provider that has lower latency.


### 2. Install NoMachine Client
These instances usually come with VNC enabled by default. However I've found VNC performances to be pretty bad, especially for realtime applications, so we are going to replace it with a much better alternative called [NoMachine](https://nomachine.com) that has nearly-local performances (tested on a 100Mb connection) and sound support.

So for start you are going to need to install the client (that we will use later) in your local machine, you can use one of the following links:
- [NoMachine (community edition)](https://www.nomachine.com/download) : Client+Server single app 
- [NoMachine Enterprise Client](https://www.nomachine.com/product&p=NoMachine%20Enterprise%20Client): Client only


### 3. Spawn an instance and get access credentials

Now we can start with the server: spawn a new instance on the provider you've found before and then collect the following access infos:
- instance ip
- username
- password

If you rented from Scaleway, you can get all those infos from the instance dashboard that should look something like this
![image](https://user-images.githubusercontent.com/4943530/150140692-afa252df-0214-4d1d-abe8-bdc36cc38468.png)


Note: VNCPassword is also the user account password and the ssh user **m1** is also the user account name


### 4. Ssh into the newly created instance
If you are on linux chances are that you have already an ssh client installed, so  you can just call
`ssh m1@your.instance.ip.address`
from the command line.
On windows you can use something like PuTTY, if you have never done that before you can follow this guide: https://tomjorge.me/how-do-i-connect-to-my-scaleway-cloud-instance-via-windows/ (it's the same for other providers).



### 5. Install the required software on the server instance
To have a working jme dev environment we are going to need the following software:
- **Homebrew Package Manager** : It will make software installation easier 
- **Java11**: Java <= 8 has issues on mac
- **Visual Studio Code with java extensions**: lightweight editor  (this is my editor of choice, but you can use your favorite one)
- **NoMachine**: Remote access server 

The following script does all that for you.
- *Note*: you will be asked to input the password you got in point 3
- *Note2*: There is an issue with audio driver installation in MacOS 12 and NoMachine 7.7.4, the script applies a workaround, if your instance doesn't have the affected software you can disable the workaround by commenting the `IS_MACOS12="1"` line.
- *Note3*:  if your instance is x86_64: comment the Apple Silicon JAVA_URL and uncomment the x86_64 url



```bash
IS_MACOS12="1"
NO_MACHINE_URL="https://download.nomachine.com/download/7.7/MacOSX/nomachine_7.7.4_1.dmg"

#For Apple Silicon M1
JAVA_URL="https://cdn.azul.com/zulu/bin/zulu11.54.23-ca-jdk11.0.14-macosx_aarch64.dmg" 

# For x86 64 bit
#JAVA_URL="https://cdn.azul.com/zulu/bin/zulu11.54.23-ca-jdk11.0.14-macosx_x64.dmg" 

# Download no machine
cd /tmp
curl "$NO_MACHINE_URL" -o nomachine.dmg


# Install
hdiutil mount nomachine.dmg
cd /Volumes/NoMachine
sudo installer -pkg NoMachine.pkg -target /
cd /tmp

# Download and install homebrew packet manager
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

echo 'eval "$(/opt/homebrew/bin/brew shellenv)"' >> $HOME/.zprofile
eval "$(/opt/homebrew/bin/brew shellenv)"
    
# Install OpenJDK11
cd /tmp
curl "$JAVA_URL" -o java.dmg
hdiutil mount java.dmg
cd /Volumes/Azul\ Zulu\ JDK*
sudo installer -pkg *Zulu*.pkg -target /


# Install Visual Studio Code
brew install --cask visual-studio-code


# Workaround for audio not working in MacOS 12 (https://knowledgebase.nomachine.com/TR12S10423)
if [ "$IS_MACOS12" = "1" ];
then
    sudo rm -rf /Library/Extensions/nxaudio.kext /Library/Audio/Plug-Ins/HAL/NMAudio.driver /Library/Audio/Plug-Ins/HAL/NMAudioMic.driver
    sudo mkdir -p /Library/Audio/Plug-Ins/HAL/

    sudo cp -a /Applications/NoMachine.app/Contents/Frameworks/bin/drivers/NMAudio.driver    /Library/Audio/Plug-Ins/HAL/NMAudio.driver
    sudo cp -a /Applications/NoMachine.app/Contents/Frameworks/bin/drivers/NMAudioMic.driver /Library/Audio/Plug-Ins/HAL/NMAudioMic.driver

    sudo chmod -R 755 /Library/Audio/Plug-Ins/HAL/NMAudio*
    sudo chown -R "root:wheel" /Library/Audio/Plug-Ins/HAL/NMAudio*
    
    sudo launchctl stop com.apple.audio.coreaudiod
    sudo launchctl start com.apple.audio.coreaudiod
fi


# Restart everything
sudo reboot
```

### 6. Grant the permissions
Now we need to grant the required permissions to NoMachine Server (nxnode).
This is the most annoying part, since it cannot be done from the command line but it has to be done manually from the UI with VNC.

So, log into your instance with VNC. If you are familiar with VNC, you'll know what to do, if not, this is the relevant tutorial  [ How to connect to a Mac mini M1 | Scaleway](https://www.scaleway.com/en/docs/compute/apple-silicon/how-to/connect-to-mac-mini-m1/) .
For convenience here a list of VNC clients:
- [TightVNC](https://www.tightvnc.com/): Windows/Linux
- [KRDC](https://apps.kde.org/krdc/): Linux+kde  (this is the client i've been using while writing this guide)
- [Remmina](https://remmina.org/): Linux
- [RealVNC](https://www.realvnc.com) : Windows/Linux

Once you are logged into MacOS, you need to go in Menu -> System preferences

![image](https://user-images.githubusercontent.com/4943530/150140737-290aca3d-fcc1-4137-aa0a-16af3f428bb7.png)


From there you need to go in **Security & Privacy** -> **Privacy**
Click the lock icon and input the password.

![image](https://user-images.githubusercontent.com/4943530/150140767-3c6c9d41-f059-4306-b04d-049094add5e1.png)

Now you need to enable the following permissions:

-  Accessibility
- Full Disk Access
- Microphone
- Screen Recording

*Note: Some permissions might not be recorded immediately, you might need to attempt to connect with NoMachine client once before they appear in Security&Privacy.*

See images below:

![image](https://user-images.githubusercontent.com/4943530/150140816-6032181f-b304-4838-b720-347abdf6ebb6.png)

![image](https://user-images.githubusercontent.com/4943530/150140847-6ada472c-e0cb-4dfb-84b1-09d7c1e8aedb.png)

![image](https://user-images.githubusercontent.com/4943530/150140852-69df9de7-327f-4ca1-8678-f44ce4d7598b.png)

![image](https://user-images.githubusercontent.com/4943530/150140865-1c4b458e-4e12-4ce7-92b6-9827a76582c0.png)


### 7. Done
Now you are good to go, you can close VNC, connect directly with NoMachine and start your development and testing.
If you use Visual Studio Code as editor, you will need to open it and install the [java extension pack](https://marketplace.visualstudio.com/items?itemName=vscjava.vscode-java-pack).
