const { exec } = require("child_process");

const installFonts = () => {
    // Using apt-get for Ubuntu
    const command = "yes | apt-get install -y fonts-liberation ttf-mscorefonts-installer";
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