const { exec } = require("child_process");

const installFonts = () => {
    // Using apk for Alpine Linux
    const command = "apk add --no-cache fontconfig msttcorefonts-installer && update-ms-fonts";
    exec(command, (error, stdout, stderr) => {
        if (error) {
            console.error(`Error occurred: ${error.message}`);
            return;
        }
        if (stderr) {
            console.error(`Error output: ${stderr}`);
        }
        console.log(`Command output:\n${stdout}`);
    });
};

installFonts();