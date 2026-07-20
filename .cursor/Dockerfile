########################################################
# Jade Gold NYC — Cursor Cloud Agent environment
# System deps only. Cursor checks out the repo at runtime.
# Do not COPY the project into this image.
########################################################

FROM ubuntu:24.04

ENV DEBIAN_FRONTEND=noninteractive
ENV NODE_MAJOR=22

# Base tools
RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    curl \
    gnupg \
    git \
    git-lfs \
    ripgrep \
    sudo \
    tmux \
    unzip \
    wget \
    zip \
    less \
    python3 \
    && rm -rf /var/lib/apt/lists/*

########################################################
# DOCKER (fuse-overlayfs + iptables-legacy for nested Docker)
########################################################

RUN install -m 0755 -d /etc/apt/keyrings && \
    curl --retry 3 --retry-delay 5 -fsSL https://download.docker.com/linux/ubuntu/gpg \
      | gpg --dearmor -o /etc/apt/keyrings/docker.gpg && \
    chmod a+r /etc/apt/keyrings/docker.gpg && \
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \
      https://download.docker.com/linux/ubuntu \
      $(. /etc/os-release && echo \"$VERSION_CODENAME\") stable" \
      | tee /etc/apt/sources.list.d/docker.list > /dev/null && \
    apt-get update && \
    apt-get install -y --no-install-recommends \
      docker-ce \
      docker-ce-cli \
      containerd.io \
      docker-buildx-plugin \
      docker-compose-plugin \
      fuse-overlayfs \
      iptables \
    && rm -rf /var/lib/apt/lists/*

RUN mkdir -p /etc/docker && \
    printf '%s\n' '{' \
    '  "storage-driver": "fuse-overlayfs"' \
    '}' > /etc/docker/daemon.json

RUN update-alternatives --set iptables /usr/sbin/iptables-legacy && \
    update-alternatives --set ip6tables /usr/sbin/ip6tables-legacy

########################################################
# NODE.js (matches repo .nvmrc)
########################################################

RUN curl -fsSL https://deb.nodesource.com/setup_${NODE_MAJOR}.x | bash - && \
    apt-get install -y --no-install-recommends nodejs && \
    rm -rf /var/lib/apt/lists/* && \
    node --version && npm --version

########################################################
# SUPABASE CLI (required by scripts/dev-supabase-setup.sh)
########################################################

RUN ARCH="$(dpkg --print-architecture)" && \
    case "$ARCH" in \
      amd64) SB_ARCH=amd64 ;; \
      arm64) SB_ARCH=arm64 ;; \
      *) echo "Unsupported arch: $ARCH" >&2; exit 1 ;; \
    esac && \
    curl -fsSL "https://github.com/supabase/cli/releases/latest/download/supabase_linux_${SB_ARCH}.tar.gz" \
      | tar -xz -C /usr/local/bin supabase && \
    chmod +x /usr/local/bin/supabase && \
    supabase --version

########################################################
# USER (ubuntu + docker + passwordless sudo)
########################################################

RUN id -u ubuntu &>/dev/null || useradd -m -s /bin/bash ubuntu && \
    groupadd -f docker && \
    usermod -aG docker ubuntu && \
    usermod -aG sudo ubuntu && \
    echo "ubuntu ALL=(ALL) NOPASSWD:ALL" > /etc/sudoers.d/ubuntu && \
    chmod 0440 /etc/sudoers.d/ubuntu

USER ubuntu
WORKDIR /home/ubuntu
CMD ["/bin/bash"]
