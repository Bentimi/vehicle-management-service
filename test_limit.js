async function run() {
    const email = "ratelimituser@example.com";
    const password = "ValidPassword123!";
    
    try {
        console.log("Signing up user...");
        const res = await fetch('http://localhost:5000/api/user/signup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                first_name: "Test",
                last_name: "User",
                email,
                password,
                gender: "male"
            })
        });
        if(res.status === 409) {
            console.log("User already exists, continuing...");
        } else {
            console.log("Signup status:", res.status);
        }
    } catch(e) {
        console.error("Signup failed", e.message);
    }

    console.log("Starting incorrect logins...");
    for(let i = 0; i < 8; i++) {
        try {
            const res = await fetch('http://localhost:5000/api/user/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email,
                    password: "WrongPassword"
                })
            });
            console.log(`Incorrect Login ${i+1}: got status`, res.status);
        } catch(e) {
            console.log(`Incorrect Login ${i+1} failed with status:`, e.message);
        }
    }

    console.log("Attempting correct login...");
    try {
        const res = await fetch('http://localhost:5000/api/user/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email,
                password
            })
        });
        console.log(`Correct Login: got status`, res.status);
    } catch(e) {
        console.log(`Correct Login failed with status:`, e.message);
    }
}
run();
