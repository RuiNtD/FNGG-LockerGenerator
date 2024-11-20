# FortniteGG Locker Generator

Program to easily showcase your locker on FortniteGG using Epic Games API. Made for personal use.

> Device code generation and some functions is based on xMistt's [DeviceAuthGenerator] project. But this program does not generate any device auths. Retrieves the player profiles using the user's access token.

After completing the authorization, start the process and the program will open your locker.

![image](https://github.com/Liqutch/FNGG-LockerGenerator/assets/113312256/5bbaefde-d972-4975-aece-f4b1a99428d7)

# Usage

1. Install [Deno](https://deno.com/)
2. Run ProfileExtractor with `start.bat`
3. Login the the Epic Games account you want to download profiles for when prompted.
4. Wait 5 or less seconds for logging in, then you can start the process.

# Special Thanks

- Liqutch for the [original Python version this is based on][upstream]!
- xMistt's [DeviceAuthGenerator]
- LeleDerGrasshalmi's [Epic Games API Documentation][endpoints]

[upstream]: https://github.com/Liqutch/FNGG-LockerGenerator
[DeviceAuthGenerator]: https://github.com/xMistt/DeviceAuthGenerator
[endpoints]: https://github.com/LeleDerGrasshalmi/FortniteEndpointsDocumentation/tree/main/EpicGames/FN-Service/Game/Profile
