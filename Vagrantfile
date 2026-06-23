Vagrant.configure("2") do |config|

  config.vm.define "vm_website_IA" do |vm|

    # Box
    vm.vm.box = "cloud-image/debian-13"
    vm.vm.hostname = "vm-website-IA"

    # Plugin disque (vagrant-disksize)
    vm.disksize.size = "20GB"

    # Network
    vm.vm.network "public_network", type: "dhcp"

    # Provider VirtualBox
    vm.vm.provider "virtualbox" do |vb|
      vb.gui = false
      vb.name = "vm_website_IA"
      vb.memory = 2048
      vb.cpus = 2
    end

    # Provisionnement route par défaut
    config.vm.provision "shell", run: "always", inline: <<-SHELL
        # Supprime TOUTES les routes par défaut passant par l'interface NAT (enp0s3)
        while ip route del default dev enp0s3 2>/dev/null; do :; done

        # Vérifie qu'il ne reste qu'une seule route par défaut (celle du DHCP sur enp0s8)
        ip route show default
    SHELL

    # Resize disque au premier boot
    vm.vm.provision "shell",
      run: "once",
      inline: <<-SHELL
        growpart /dev/sda 1 || true
        resize2fs /dev/sda1 || true
      SHELL

  end

end