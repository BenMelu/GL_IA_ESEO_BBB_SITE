const fileIn = document.getElementById("fileInput");
const preview= document.getElementById("fileInit");

fileIn.addEventListener("change", () => {
    const file = fileIn.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        preview.classList.add("visible");
        preview.src = e.target.result;
    };
    reader.readAsDataURL(file);
});


async function sendImage() {
    const file = fileIn.files[0];
    if (!file) return alert("Choisissez une image");

    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch("http://localhost:5000/process", {
        method: "POST",
        body: formData
    });

    if (!res.ok) {
        alert("Erreur serveur");
        return;
    }

    const blob = await res.blob();
    
    document.getElementById("result").src = URL.createObjectURL(blob);
    
}