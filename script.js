class PremiumMemoryGallery {
    constructor() {
        this.gallery = document.getElementById('gallery');
        this.imageInput = document.getElementById('imageInput');
        this.memoryTitle = document.getElementById('memoryTitle');
        this.memoryDate = document.getElementById('memoryDate');
        this.modal = document.getElementById('imageModal');
        this.editModal = document.getElementById('editModal');
        this.totalMemoriesEl = document.getElementById('totalMemories');
        this.totalYearsEl = document.getElementById('totalYears');
        this.emptyState = document.getElementById('emptyState');

        this.currentImageIndex = -1;
        this.memories = [];
        this.maxStorageSize = 4 * 1024 * 1024; // 4MB limit for mobile

        this.init();
        this.loadMemories();
        this.updateStats();
    }

    init() {
        // File input
        this.imageInput.addEventListener('change', (e) => this.handleImageUpload(e));

        // Upload label click
        const uploadLabel = document.querySelector('.upload-label');
        uploadLabel.addEventListener('click', (e) => {
            e.preventDefault();
            this.imageInput.value = '';
            this.imageInput.click();
        });

        // Modal events
        document.getElementById('closeModal').addEventListener('click', () => this.closeModal());
        document.getElementById('deleteBtn').addEventListener('click', () => this.deleteCurrentMemory());
        document.getElementById('editBtn').addEventListener('click', () => this.openEditModal());

        // Edit modal events
        document.getElementById('saveEdit').addEventListener('click', () => this.saveEdit());
        document.getElementById('cancelEdit').addEventListener('click', () => this.closeEditModal());

        // Close modals
        this.modal.addEventListener('click', (e) => e.target === this.modal && this.closeModal());
        this.editModal.addEventListener('click', (e) => e.target === this.editModal && this.closeEditModal());

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeModal();
                this.closeEditModal();
            }
        });

        // Default date
        this.memoryDate.value = new Date().toISOString().split('T')[0];
    }

    // 🔥 MOBILE-FIX: Compress images for storage
    compressImage(file, maxWidth = 800, quality = 0.7) {
        return new Promise((resolve) => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const img = new Image();

            img.onload = () => {
                // Calculate new size
                const ratio = Math.min(maxWidth / img.width, maxWidth / img.height);
                canvas.width = img.width * ratio;
                canvas.height = img.height * ratio;

                // Draw and compress
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
                resolve(compressedDataUrl);
            };

            img.src = URL.createObjectURL(file);
        });
    }

    async handleImageUpload(event) {
        const files = Array.from(event.target.files);
        if (files.length === 0) return;

        const title = this.memoryTitle.value.trim() || `Vedhant & Vedhansh - ${new Date().toLocaleDateString()}`;
        const date = this.memoryDate.value || new Date().toISOString().split('T')[0];

        for (let file of files) {
            if (file.type.startsWith('image/')) {
                try {
                    // Compress image for mobile storage
                    const compressedImageData = await this.compressImage(file, 800, 0.8);
                    
                    this.addMemory({
                        imageData: compressedImageData,
                        title: title,
                        date: date,
                        filename: file.name
                    });
                } catch (error) {
                    console.error('Image compression failed:', error);
                    // Fallback: use original (smaller images)
                    const reader = new FileReader();
                    reader.onload = (e) => {
                        this.addMemory({
                            imageData: e.target.result,
                            title: title,
                            date: date,
                            filename: file.name
                        });
                    };
                    reader.readAsDataURL(file);
                }
            }
        }

        // Reset form
        setTimeout(() => {
            this.memoryTitle.value = '';
            this.memoryDate.value = new Date().toISOString().split('T')[0];
            this.imageInput.value = '';
        }, 100);
    }

    addMemory(memoryData) {
        const memory = {
            id: 'mem_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
            imageData: memoryData.imageData,
            title: memoryData.title.substring(0, 50),
            date: memoryData.date,
            filename: memoryData.filename,
            createdAt: new Date().toISOString()
        };

        this.memories.unshift(memory);
        
        // Limit to 20 memories on mobile to prevent storage issues
        if (this.memories.length > 20) {
            this.memories = this.memories.slice(0, 20);
        }

        this.renderMemory(memory);
        this.saveMemories();
        this.updateStats();
        this.hideEmptyState();
    }

    renderMemory(memory) {
        const imageItem = document.createElement('div');
        imageItem.className = 'image-item';
        imageItem.dataset.memoryId = memory.id;
        imageItem.onclick = (e) => {
            e.stopPropagation();
            this.openModal(memory.id);
        };

        imageItem.innerHTML = `
            <div class="image-container">
                <img src="${memory.imageData}" alt="${memory.title}" loading="lazy">
            </div>
            <div class="memory-info">
                <span class="memory-title">${memory.title}</span>
                <div class="memory-date">
                    <i class="fas fa-calendar"></i>
                    ${new Date(memory.date).toLocaleDateString('en-US', { 
                        year: 'numeric', month: 'short', day: 'numeric' 
                    })}
                </div>
            </div>
        `;

        this.gallery.insertBefore(imageItem, this.gallery.firstChild);
    }

    openModal(memoryId) {
        this.currentImageIndex = this.memories.findIndex(m => m.id === memoryId);
        const memory = this.memories[this.currentImageIndex];

        if (memory) {
            document.getElementById('modalTitle').textContent = memory.title;
            document.getElementById('modalImage').src = memory.imageData;
            document.getElementById('modalImage').alt = memory.title;
            
            document.getElementById('modalDate').textContent = 
                new Date(memory.date).toLocaleDateString('en-US', {
                    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
                });

            this.modal.style.display = 'block';
            document.body.style.overflow = 'hidden';
        }
    }

    closeModal() {
        this.modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }

    openEditModal() {
        const memory = this.memories[this.currentImageIndex];
        if (memory) {
            document.getElementById('editTitle').value = memory.title;
            document.getElementById('editDate').value = memory.date;
            this.editModal.style.display = 'block';
            document.body.style.overflow = 'hidden';
        }
    }

    closeEditModal() {
        this.editModal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }

    saveEdit() {
        const memory = this.memories[this.currentImageIndex];
        if (!memory) return;

        const newTitle = document.getElementById('editTitle').value.trim();
        const newDate = document.getElementById('editDate').value;

        if (newTitle) {
            memory.title = newTitle.substring(0, 50);
            if (newDate) memory.date = newDate;

            // Update gallery
            const galleryItem = document.querySelector(`[data-memory-id="${memory.id}"]`);
            if (galleryItem) {
                galleryItem.querySelector('.memory-title').textContent = memory.title;
                const dateEl = galleryItem.querySelector('.memory-date');
                dateEl.innerHTML = `<i class="fas fa-calendar"></i>
                    ${new Date(memory.date).toLocaleDateString('en-US', { 
                        year: 'numeric', month: 'short', day: 'numeric' 
                    })}`;
            }

            // Update modal
            document.getElementById('modalTitle').textContent = memory.title;
            document.getElementById('modalDate').textContent = 
                new Date(memory.date).toLocaleDateString('en-US', {
                    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
                });

            this.saveMemories();
            this.closeEditModal();
        }
    }

    deleteCurrentMemory() {
        if (this.currentImageIndex >= 0) {
            if (confirm('Delete this precious memory? 😢')) {
                const memoryId = this.memories[this.currentImageIndex].id;
                
                const galleryItem = document.querySelector(`[data-memory-id="${memoryId}"]`);
                if (galleryItem) {
                    galleryItem.style.animation = 'fadeOut 0.5s ease forwards';
                    setTimeout(() => galleryItem.remove(), 500);
                }

                this.memories.splice(this.currentImageIndex, 1);
                this.saveMemories();
                this.updateStats();
                this.closeModal();

                if (this.memories.length === 0) this.showEmptyState();
            }
        }
    }

    updateStats() {
        this.totalMemoriesEl.textContent = this.memories.length;
        if (this.memories.length > 0) {
            const years = [...new Set(this.memories.map(m => new Date(m.date).getFullYear()))]
                .sort((a,b)=>b-a).join(', ');
            this.totalYearsEl.textContent = years;
        }
    }

    showEmptyState() { this.emptyState.style.display = 'block'; }
    hideEmptyState() { this.emptyState.style.display = 'none'; }

    // 🔥 MOBILE-FIX: Smart storage with size check
    saveMemories() {
        try {
            const dataString = JSON.stringify(this.memories);
            const dataSize = new Blob([dataString]).size;

            if (dataSize > this.maxStorageSize) {
                console.warn('Storage full! Keeping latest 10 memories');
                this.memories = this.memories.slice(0, 10);
                const trimmedData = JSON.stringify(this.memories);
                localStorage.setItem('vedhantVedhanshMemories_v2', trimmedData);
            } else {
                localStorage.setItem('vedhantVedhanshMemories_v2', dataString);
            }
        } catch (e) {
            console.error('Save failed:', e);
        }
    }

    // 🔥 MOBILE-FIX: Robust load with error recovery
    loadMemories() {
        try {
            // Try new key first
            let saved = localStorage.getItem('vedhantVedhanshMemories_v2');
            
            // Fallback to old key
            if (!saved) {
                saved = localStorage.getItem('vedhantVedhanshMemories');
            }

            if (saved) {
                const parsed = JSON.parse(saved);
                // Validate data
                this.memories = Array.isArray(parsed) ? parsed.filter(m => m && m.imageData && m.id) : [];
                
                // Clear and re-render
                this.gallery.innerHTML = '<div class="empty-state" id="emptyState" style="display:none;"><i class="fas fa-heart-broken"></i><h3>No memories yet</h3><p>Add your first precious moment above!</p></div>';
                
                this.memories.forEach(memory => this.renderMemory(memory));
                
                this.updateStats();
                this.memories.length > 0 ? this.hideEmptyState() : this.showEmptyState();
            } else {
                this.showEmptyState();
            }
        } catch (e) {
            console.error('Load failed, clearing storage:', e);
            localStorage.removeItem('vedhantVedhanshMemories_v2');
            localStorage.removeItem('vedhantVedhanshMemories');
            this.memories = [];
            this.showEmptyState();
        }
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    window.gallery = new PremiumMemoryGallery();
});

// FadeOut animation
if (!document.querySelector('#fadeOutStyle')) {
    const style = document.createElement('style');
    style.id = 'fadeOutStyle';
    style.textContent = `@keyframes fadeOut { from { opacity: 1; transform: translateY(0); } to { opacity: 0; transform: translateY(-20px); } }`;
    document.head.appendChild(style);
}
