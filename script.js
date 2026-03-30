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

        this.init();
        this.loadMemories();
        this.updateStats();
    }

    init() {
        // File input
        const uploadLabel = document.querySelector('.upload-label');
        uploadLabel.addEventListener('click', () => this.imageInput.click());

        this.imageInput.addEventListener('change', (e) => this.handleImageUpload(e));

        // Modal events
        document.getElementById('closeModal').addEventListener('click', () => this.closeModal());
        document.getElementById('deleteBtn').addEventListener('click', () => this.deleteCurrentMemory());
        document.getElementById('editBtn').addEventListener('click', () => this.openEditModal());

        // Edit modal events
        document.getElementById('saveEdit').addEventListener('click', () => this.saveEdit());
        document.getElementById('cancelEdit').addEventListener('click', () => this.closeEditModal());

        // Close modals on outside click
        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal) this.closeModal();
        });

        this.editModal.addEventListener('click', (e) => {
            if (e.target === this.editModal) this.closeEditModal();
        });

        // Close on Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeModal();
                this.closeEditModal();
            }
        });

        // Set default date to today
        this.memoryDate.valueAsDate = new Date();
    }

    handleImageUpload(event) {
        const files = Array.from(event.target.files);
        const title = this.memoryTitle.value.trim() || 'Beautiful Moment';
        const date = this.memoryDate.value || new Date().toISOString().split('T')[0];

        files.forEach(file => {
            if (file.type.startsWith('image/')) {
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
        });

        // Reset form
        this.memoryTitle.value = '';
        this.memoryDate.valueAsDate = new Date();
        this.imageInput.value = '';
    }

    addMemory(memoryData) {
        const memory = {
            id: Date.now() + Math.random(),
            imageData: memoryData.imageData,
            title: memoryData.title,
            date: memoryData.date,
            filename: memoryData.filename,
            createdAt: new Date().toISOString()
        };

        this.memories.unshift(memory); // Add to beginning
        this.renderMemory(memory);
        this.saveMemories();
        this.updateStats();
        this.hideEmptyState();
    }

    renderMemory(memory) {
        const imageItem = document.createElement('div');
        imageItem.className = 'image-item';
        imageItem.dataset.memoryId = memory.id;
        imageItem.onclick = () => this.openModal(memory.id);

        imageItem.innerHTML = `
            <div class="image-container">
                <img src="${memory.imageData}" alt="${memory.title}" loading="lazy">
            </div>
            <div class="memory-info">
                <span class="memory-title">${memory.title}</span>
                <div class="memory-date">
                    <i class="fas fa-calendar"></i>
                    ${new Date(memory.date).toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'short', 
                        day: 'numeric' 
                    })}
                </div>
            </div>
        `;

        this.gallery.insertBefore(imageItem, this.gallery.firstChild);
    }

    openModal(memoryId) {
        this.currentImageIndex = this.memories.findIndex(m => m.id == memoryId);
        const memory = this.memories[this.currentImageIndex];

        if (memory) {
            document.getElementById('modalTitle').textContent = memory.title;
            document.getElementById('modalImage').src = memory.imageData;
            document.getElementById('modalDate').textContent = 
                new Date(memory.date).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
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
        if (memory) {
            const newTitle = document.getElementById('editTitle').value.trim();
            const newDate = document.getElementById('editDate').value;

            if (newTitle) {
                memory.title = newTitle;
                memory.date = newDate || memory.date;

                // Update gallery item
                const galleryItem = document.querySelector(`[data-memory-id="${memory.id}"]`);
                if (galleryItem) {
                    galleryItem.querySelector('.memory-title').textContent = memory.title;
                    galleryItem.querySelector('.memory-date').innerHTML = `
                        <i class="fas fa-calendar"></i>
                        ${new Date(memory.date).toLocaleDateString('en-US', { 
                            year: 'numeric', 
                            month: 'short', 
                            day: 'numeric' 
                        })}
                    `;
                }

                // Update modal
                document.getElementById('modalTitle').textContent = memory.title;
                document.getElementById('modalDate').textContent = 
                    new Date(memory.date).toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                    });

                this.saveMemories();
                this.closeEditModal();
            }
        }
    }

    deleteCurrentMemory() {
        if (this.currentImageIndex >= 0) {
            if (confirm('Are you sure you want to delete this precious memory? 😢')) {
                const memoryId = this.memories[this.currentImageIndex].id;
                
                // Remove from gallery
                const galleryItem = document.querySelector(`[data-memory-id="${memoryId}"]`);
                if (galleryItem) {
                    galleryItem.style.animation = 'fadeOut 0.5s ease forwards';
                    setTimeout(() => galleryItem.remove(), 500);
                }

                // Remove from array
                this.memories.splice(this.currentImageIndex, 1);
                
                this.saveMemories();
                this.updateStats();
                this.closeModal();

                if (this.memories.length === 0) {
                    this.showEmptyState();
                }
            }
        }
    }

    deleteMemoryById(memoryId) {
        const index = this.memories.findIndex(m => m.id == memoryId);
        if (index > -1) {
            this.memories.splice(index, 1);
            const galleryItem = document.querySelector(`[data-memory-id="${memoryId}"]`);
            if (galleryItem) {
                galleryItem.remove();
            }
            this.saveMemories();
            this.updateStats();
            if (this.memories.length === 0) {
                this.showEmptyState();
            }
        }
    }

    updateStats() {
        this.totalMemoriesEl.textContent = this.memories.length;
        
        if (this.memories.length > 0) {
            const years = new Set(this.memories.map(m => new Date(m.date).getFullYear()));
            this.totalYearsEl.textContent = Array.from(years).join(', ');
        }
    }

    showEmptyState() {
        this.emptyState.style.display = 'block';
    }

    hideEmptyState() {
        this.emptyState.style.display = 'none';
    }

    saveMemories() {
        localStorage.setItem('vedhantVedhanshMemories', JSON.stringify(this.memories));
    }

    loadMemories() {
        const saved = localStorage.getItem('vedhantVedhanshMemories');
        if (saved) {
            this.memories = JSON.parse(saved);
            this.memories.forEach(memory => this.renderMemory(memory));
            this.updateStats();
            
            if (this.memories.length === 0) {
                this.showEmptyState();
            } else {
                this.hideEmptyState();
            }
        } else {
            this.showEmptyState();
        }
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.gallery = new PremiumMemoryGallery();
});

// Add fadeOut animation to CSS (add this to your style.css)
const style = document.createElement('style');
style.textContent = `
    @keyframes fadeOut {
        from { opacity: 1; transform: translateY(0); }
        to { opacity: 0; transform: translateY(-20px); }
    }
`;
document.head.appendChild(style);