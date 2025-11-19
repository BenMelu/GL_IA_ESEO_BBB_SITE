async function sendImage() {
    const file = document.getElementById("fileInput").files[0];
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