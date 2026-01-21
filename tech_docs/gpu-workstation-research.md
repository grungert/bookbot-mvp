# Research: Dual NVIDIA GPU Workstation for Local AI Training (Germany)

## Executive Summary

Building a dual-GPU AI workstation for training and running models locally requires careful consideration of VRAM, power requirements, and PCIe bandwidth.

**Critical Limitation:** Neither RTX 4090 nor RTX 5090 support NVLink - GPUs cannot pool VRAM and operate independently.

---

## GPU Comparison

### NVIDIA RTX 5090 (Recommended for Future-Proofing)

| Spec | Value |
|------|-------|
| Architecture | Blackwell |
| VRAM | **32GB GDDR7** |
| Memory Bandwidth | 1,792 GB/s |
| CUDA Cores | 21,760 |
| Tensor Cores | 5th Gen (FP4 support) |
| TDP | 575W |
| MSRP | €2,329 (Germany) |
| **Actual Price (Jan 2026)** | **€3,000-4,000** |

**Pros:**
- 32GB VRAM enables larger models (Llama 3.3 70B, DeepSeek 32B)
- ~35-72% faster than 4090 in NLP tasks
- Future FP4 quantization support
- 2-slot design (easier to fit 2 cards)

**Cons:**
- Software stack still maturing for Blackwell
- 575W TDP = high power requirements
- Currently difficult to source

### NVIDIA RTX 4090 (Mature Ecosystem)

| Spec | Value |
|------|-------|
| Architecture | Ada Lovelace |
| VRAM | **24GB GDDR6X** |
| Memory Bandwidth | 1,008 GB/s |
| CUDA Cores | 16,384 |
| TDP | 450W |
| **Price (Used, Germany)** | **€1,400-1,700** |

**Pros:**
- Mature, well-optimized software stack
- Lower power consumption
- Available on used market
- Great for models up to ~20B parameters

**Cons:**
- Discontinued (Oct 2024)
- 24GB VRAM limiting for larger models
- No NVLink support

---

## Critical Limitation: No NVLink on RTX 40/50 Series

**Neither RTX 4090 nor RTX 5090 support NVLink.** This means:
- GPUs cannot pool VRAM (2x 32GB ≠ 64GB unified)
- Each GPU operates independently
- Communication happens over PCIe (slower)
- Must use distributed training frameworks (DeepSpeed, PyTorch DDP)

---

## NVLink Options for True Unified VRAM

If you **must** have unified VRAM (2 GPUs acting as 1), here are your options:

### Option 1: Dual RTX 3090 + NVLink (Best Value)

**True 48GB Unified VRAM** | ~€1,500-2,000 total

| Component | Price (Germany) |
|-----------|----------------|
| 2x RTX 3090 24GB (used) | €550-800 each |
| NVLink Bridge (4-slot) | €80-100 |
| **Total** | **€1,200-1,700** |

**Specs:**
- 48GB unified GDDR6X memory
- NVLink bandwidth: 112.5 GB/s (bidirectional)
- 10,496 CUDA cores per GPU
- TDP: 350W per card (700W total)

**Pros:**
- ✅ Cheapest true VRAM pooling option
- ✅ 48GB unified memory for large models
- ✅ Widely available on used market ([Kleinanzeigen.de](https://www.kleinanzeigen.de/s-pc-zubehoer-software/grafikkarten/rtx-3090/k0c225+pc_zubehoer_software.art_s:grafikkarten))
- ✅ Well-supported in AI frameworks

**Cons:**
- ❌ Older Ampere architecture (2020)
- ❌ ~40% slower than RTX 4090 per GPU
- ❌ Higher power consumption
- ❌ Used market only (no warranty)

**Can run:** Llama 3.1 70B (Q4), fine-tuning 30B+ models, DeepSeek 32B

---

### Option 2: Dual RTX A6000 + NVLink (Professional)

**True 96GB Unified VRAM** | ~€8,000-12,000 total

| Component | Price |
|-----------|-------|
| 2x RTX A6000 48GB (Ampere) | €3,500-5,000 each |
| NVLink Bridge | €100-150 |
| **Total** | **€7,100-10,150** |

**Specs:**
- 96GB unified GDDR6 ECC memory
- NVLink bandwidth: 112.5 GB/s
- 10,752 CUDA cores per GPU
- TDP: 300W per card (600W total)
- Blower-style cooling (data center design)

**Pros:**
- ✅ 96GB unified VRAM - largest consumer/workstation option
- ✅ ECC memory for training stability
- ✅ Professional drivers & support
- ✅ Lower TDP than RTX 3090

**Cons:**
- ❌ Expensive (~€8-10k for dual setup)
- ❌ Ampere architecture (same gen as RTX 3090)
- ❌ Blower coolers are loud
- ❌ **IMPORTANT:** RTX A6000 Ada (newer) does NOT support NVLink!

**Can run:** Llama 3.3 70B (FP16), training 30B+ models, DeepSeek 70B

---

### Option 3: NVIDIA A100 / H100 (Enterprise)

**Up to 160GB+ Unified VRAM** | €20,000-60,000+

| GPU | VRAM | NVLink | Price (each) |
|-----|------|--------|--------------|
| A100 PCIe 40GB | 40GB | 600 GB/s | ~€8,000-12,000 |
| A100 PCIe 80GB | 80GB | 600 GB/s | ~€12,000-18,000 |
| H100 PCIe 80GB | 80GB | 900 GB/s | ~€25,000-35,000 |
| H100 NVL (dual) | 188GB | 900 GB/s | ~€50,000+ |

**Pros:**
- ✅ Massive VRAM (up to 188GB unified on H100 NVL)
- ✅ Fastest NVLink (900 GB/s on H100)
- ✅ HBM memory (much faster than GDDR)
- ✅ Designed for 24/7 data center operation

**Cons:**
- ❌ Extremely expensive
- ❌ Requires special cooling/power
- ❌ Not practical for home/office use

**Pre-built option:** [BIZON G9000](https://bizon-tech.com/bizon-g9000.html) - 8x NVLink server starts at **$115,990**

---

### NVLink Compatibility Summary

| GPU | Generation | NVLink Support | Max Pooled VRAM |
|-----|------------|----------------|-----------------|
| **RTX 3090 / 3090 Ti** | Ampere | ✅ Yes | 48GB |
| RTX 4090 | Ada Lovelace | ❌ No | - |
| RTX 5090 | Blackwell | ❌ No | - |
| **RTX A6000 (Ampere)** | Ampere | ✅ Yes | 96GB |
| RTX A6000 Ada | Ada Lovelace | ❌ No | - |
| RTX PRO 6000 Blackwell | Blackwell | ❌ No | - |
| **A100** | Ampere | ✅ Yes | 160GB (2x80GB) |
| **H100** | Hopper | ✅ Yes | 160GB+ |

**Key insight:** NVIDIA removed NVLink from all consumer and workstation GPUs after Ampere. Only enterprise/data center GPUs (A100, H100, H200) retain NVLink in newer generations.

---

### Recommendation for Unified VRAM

| Priority | Best Option | Unified VRAM | Price |
|----------|-------------|--------------|-------|
| **Best Value** | 2x RTX 3090 + NVLink | 48GB | ~€1,500-2,000 |
| **Maximum VRAM** | 2x RTX A6000 + NVLink | 96GB | ~€8,000-10,000 |
| **Future-Proof (no pooling)** | 2x RTX 5090 | 64GB (32+32) | ~€16,000 |
| **Enterprise** | 2x A100 80GB | 160GB | ~€30,000+ |

**My Recommendation:** If unified VRAM is critical, go with **dual RTX 3090 + NVLink** (~€1,500-2,000). You get 48GB pooled memory at a fraction of the cost. The older architecture is still capable for most AI workloads, and you can always sell them later if you need to upgrade.

If you need more than 48GB unified, the **RTX A6000 (Ampere)** with 96GB pooled is the only practical option under €15k. Just make sure you get the original Ampere version, NOT the A6000 Ada.

---

## Pre-Built NVLink Workstation Availability (2025/2026)

### Reality Check: Pre-Configured NVLink Workstations Are Rare

**Bad news:** Most vendors have discontinued RTX A6000 (Ampere) in favor of newer GPUs that **don't support NVLink**:

| Vendor | RTX A6000 (NVLink) | Status |
|--------|-------------------|--------|
| BIZON | ❌ Not available | Moved to RTX 6000 Ada, RTX PRO Blackwell |
| Puget Systems | ❌ Not available | Only offers RTX PRO series |
| Exxact | ✅ Sells GPUs separately | Custom builds only |
| Xi Computer | ✅ Custom configurations | Contact for quote |

### Your Options for 96GB Unified VRAM

#### Option A: Custom Build (Recommended)

Build your own or have a local shop assemble:

| Component | Recommendation | Price (Germany) |
|-----------|---------------|-----------------|
| 2x RTX A6000 48GB | PNY or NVIDIA (Ampere, NOT Ada!) | ~€7,000-10,000 |
| NVLink Bridge (2-slot) | PNY RTXA6000NVLINK-KIT | ~€100-150 |
| CPU | AMD Threadripper PRO 5965WX/7965WX | ~€2,000-3,500 |
| Motherboard | ASUS Pro WS WRX80E-SAGE | ~€800-1,000 |
| RAM | 128GB DDR4 ECC (WRX80) | ~€500-700 |
| PSU | 1600W (Seasonic Prime TX-1600) | ~€400-500 |
| Storage | 2TB NVMe + 4TB SATA | ~€300-400 |
| Case | Full tower (be quiet! Dark Base Pro 901) | ~€250-300 |
| **TOTAL** | | **~€11,500-16,500** |

**Where to buy RTX A6000 in Germany:**
- [Amazon.de](https://www.amazon.de) - Search "RTX A6000 48GB"
- [eBay.de](https://www.ebay.de) - Used/refurbished options
- [Alternate.de](https://www.alternate.de) - Professional retailer
- [Exxact](https://www.exxactcorp.com) - Ships internationally

#### Option B: Contact Vendors for Custom Quote

These US vendors build custom NVLink workstations (ship to Germany):

1. **[Exxact Corporation](https://www.exxactcorp.com)**
   - Sells RTX A6000 GPUs and NVLink bridges
   - Custom workstation builds available
   - Contact: sales@exxactcorp.com

2. **[Xi Computer](https://www.xicomputer.com/solutions/nvidia/RTX-A6000/)**
   - Specializes in RTX A6000 workstations
   - Custom configurations with NVLink
   - Request quote on website

3. **[VFX Technologies](https://www.vfxtechnologies.com)**
   - Threadripper PRO workstations
   - Supports multiple NVIDIA RTX GPUs

**Expect to pay:** $15,000-25,000 USD + shipping + import duties (~19% VAT)

#### Option C: Budget Alternative - Dual RTX 3090 + NVLink

For ~€2,000-3,000 total, build a 48GB unified VRAM system:

| Component | Price (Germany) |
|-----------|-----------------|
| 2x RTX 3090 (used) | €1,100-1,600 |
| NVLink Bridge | €80-100 |
| Rest of system | €1,000-1,500 |
| **TOTAL** | **€2,200-3,200** |

**Pros:** Very affordable for 48GB unified VRAM
**Cons:** Older architecture, ~40% slower than A6000

---

## Recommended Configuration: Dual RTX 5090 Workstation

### Complete Build for Germany

| Component | Recommendation | Est. Price (€) |
|-----------|---------------|----------------|
| **GPU x2** | 2x NVIDIA RTX 5090 32GB | 6,000-8,000 |
| **CPU** | AMD Threadripper PRO 9955WX (64-core) or 9975WX (32-core) | 3,000-5,000 |
| **Motherboard** | ASUS Pro WS WRX90E-SAGE SE or Gigabyte WRX90 | 800-1,200 |
| **RAM** | 128GB (4x32GB) DDR5-5600 ECC RDIMM | 600-900 |
| **PSU** | Seasonic PRIME TX-1600 or be quiet! Dark Power 13 1600W (ATX 3.1) | 400-500 |
| **Storage** | 2TB Samsung 990 Pro NVMe + 4TB SATA SSD | 300-400 |
| **Cooling** | Arctic Freezer 420mm AIO or custom liquid loop | 150-400 |
| **Case** | be quiet! Dark Base Pro 901 or Fractal Torrent XL | 200-300 |
| **TOTAL** | | **€11,500-16,700** |

### Why Threadripper PRO?

- **128 PCIe 5.0 lanes** - Full x16 bandwidth for both GPUs
- **8-channel DDR5 memory** - 2TB max capacity
- **ECC support** - Critical for long training runs
- Best multi-threaded performance for data preprocessing

### Alternative: Budget Build with RTX 4090

| Component | Recommendation | Est. Price (€) |
|-----------|---------------|----------------|
| **GPU x2** | 2x NVIDIA RTX 4090 24GB (used) | 2,800-3,400 |
| **CPU** | AMD Ryzen 9 9950X or Intel i9-14900K | 500-700 |
| **Motherboard** | ASUS ROG Crosshair X670E or MSI MEG X670E | 400-600 |
| **RAM** | 128GB (4x32GB) DDR5-6000 | 400-500 |
| **PSU** | Corsair HX1500i or be quiet! Dark Power 13 1200W | 300-350 |
| **Storage** | 2TB NVMe + 4TB SATA | 250-350 |
| **Cooling** | 360mm AIO | 150-250 |
| **Case** | Full tower with good airflow | 150-200 |
| **TOTAL** | | **€5,000-6,400** |

---

## Power Requirements

| Configuration | PSU Recommendation |
|--------------|-------------------|
| Single RTX 5090 | 1000W minimum |
| Dual RTX 5090 | **1600W minimum**, 2000W recommended |
| Single RTX 4090 | 850W minimum |
| Dual RTX 4090 | **1200W minimum**, 1600W recommended |

**Critical:** Use ATX 3.1 PSU with native 12V-2x6 connectors (600W rated per connector).

---

## What You Can Run (Model Examples)

### Single RTX 5090 (32GB)
- Llama 3.1 70B (Q4 quantized)
- DeepSeek-R1 32B (full precision)
- Stable Diffusion XL + ControlNet
- Whisper Large V3

### Dual RTX 5090 (2x 32GB, distributed)
- Llama 3.3 70B (FP16 with model parallelism)
- Fine-tuning 70B models with LoRA
- Training custom 7B-13B models from scratch
- Multiple concurrent inference jobs

### Single RTX 4090 (24GB)
- Llama 3.1 8B-13B (FP16)
- Mistral 7B, Mixtral 8x7B (quantized)
- Fine-tuning up to 20B with QLoRA

---

## Where to Buy in Germany

### GPUs
- [Mindfactory.de](https://www.mindfactory.de) - Often best prices
- [Alternate.de](https://www.alternate.de) - Good availability
- [Caseking.de](https://www.caseking.de) - Premium/watercooled options
- [Notebooksbilliger.de](https://www.notebooksbilliger.de) - Official NVIDIA FE partner
- [Geizhals.de](https://www.geizhals.de) - Price comparison

### Pre-Built Workstations
- [BIZON](https://bizon-tech.com) - Ships to Germany, specialized AI workstations
- [Puget Systems](https://www.pugetsystems.com) - US-based, ships internationally

---

## Recommendations

### For Serious AI Training/Research: **Dual RTX 5090**
- 64GB total VRAM (32GB per GPU)
- Handles 70B models with quantization
- Future-proof for next 3-5 years
- **Budget: €12,000-17,000**

### For Development & Fine-Tuning: **Dual RTX 4090 (Used)**
- 48GB total VRAM (24GB per GPU)
- Mature software ecosystem
- Excellent price/performance
- **Budget: €5,000-6,500**

### If VRAM Pooling Critical: **Dual RTX 3090 with NVLink**
- True 48GB unified VRAM
- Only consumer cards with NVLink
- Older architecture but functional
- **Budget: €2,500-3,500**

---

## BIZON Z5000 G2 Pre-Built Workstation Configurator

**Base Price: $14,684** | Ships to Germany | Estimated Ship Date: 3-7 Days

The BIZON Z5000 G2 is a 4x-6x GPU deep learning workstation with custom liquid cooling (CPU + GPUs). Up to 3x lower noise vs air-cooling.

### Processor (Intel Xeon W Series)

| Option | Price |
|--------|-------|
| 16-Core 3.20 GHz Intel Xeon W5-3525 | +$0 (base) |
| 20-Core 2.90 GHz Intel Xeon W5-3535X | +$818 |
| 24-Core 2.70 GHz Intel Xeon W7-3545 | +$1,385 |
| 32-Core 2.50 GHz Intel Xeon W7-3565X | +$2,249 |
| 44-Core 2.20 GHz Intel Xeon W9-3575X | +$3,720 |
| 60-Core 2.00 GHz Intel Xeon W9-3595X | +$6,353 |

### Cooling

| Option | Price |
|--------|-------|
| Custom Liquid Cooling System (CPU + GPUs) | +$0 (included) |

### Memory (DDR5 ECC/REG)

| Option | Price |
|--------|-------|
| 2x 16 GB DDR5 ECC/REG (32GB total) | +$0 (base) |
| 2x 32 GB DDR5 ECC/REG (64GB total) | +$952 |
| 2x 64 GB DDR5 ECC/REG (128GB total) | +$2,328 |
| 2x 128 GB DDR5 ECC/REG (256GB total) | +$6,412 |

### GPU Support (Case + PSU Configuration)

| Option | Price |
|--------|-------|
| 2 GPU-Ready (up to 2x RTX 40xx, 1500W PSU) | +$0 (base) |
| 4 GPU-Ready for 4x 4090/Ada/A100/H100 or 2x 5090/H200 (3000W PSU) | +$810 |
| 4 GPU-Ready for 4x 5090/H200/RTX PRO or 7x 40xx/A100/H100/Ada (4500W PSU) | +$6,390 |
| 7 GPU-Ready for 7x RTX 50xx/RTX PRO/H200 (6000W PSU) | +$10,050 |

### Operating System

| Option | Price |
|--------|-------|
| Ubuntu 24.04 (BIZON OS + TensorFlow, PyTorch, CUDA, cuDNN, SLURM) | +$0 |
| Windows 11 Pro (includes deep learning stack) | +$203 |
| Windows 11 Pro | +$203 |
| Rocky Linux 9 | +$0 |
| Ubuntu 24.04 (Cryo-EM software package, SLURM) | +$0 |
| No operating system | +$0 |

### Graphics Cards

**Dedicated Display Card:**
| Option | Price |
|--------|-------|
| 1x NVIDIA A1000 8GB | +$0 (base) |

**GeForce 50 Series (Liquid-Cooled):**
| Option | Price |
|--------|-------|
| 2x Liquid-cooled NVIDIA RTX 5080 16GB | +$4,720 |
| 2x Liquid-cooled NVIDIA RTX 5090 32GB | +$11,500 |

**Professional RTX (Blackwell):**
| Option | Price |
|--------|-------|
| 2x Liquid-cooled NVIDIA RTX PRO 6000 Blackwell 96GB | +$29,640 |

**Compute GPUs:**
| Option | Price |
|--------|-------|
| 1x Liquid-cooled NVIDIA H200 141GB NVL | +$47,320 |

### NVIDIA NVLink Bridge

*Note: Only for NVIDIA A100, H100, H200, A6000*

| Option | Price |
|--------|-------|
| Not included | +$0 |
| 1x NVLink for 2x NVIDIA A100/H100/H200 | +$597 |

### Storage - SSD #1 (OS & Applications)

**PCI-E 4.0 NVMe (Up to 7000 MB/s):**
| Option | Price |
|--------|-------|
| 500 GB PCI-E 4.0 NVMe SSD | +$0 (base) |
| 1 TB PCI-E 4.0 NVMe SSD | +$200 |
| 2 TB PCI-E 4.0 NVMe SSD | +$388 |
| 4 TB PCI-E 4.0 NVMe SSD | +$595 |
| 7.68 TB PCI-E 4.0 NVMe SSD | +$2,225 |
| 15.36 TB PCI-E 4.0 NVMe SSD | +$4,023 |
| 30.72 TB PCI-E 4.0 NVMe SSD | +$6,711 |
| 61.44 TB PCI-E 4.0 NVMe SSD | +$15,633 |

**PCI-E 5.0 NVMe (Up to 13000 MB/s):**
| Option | Price |
|--------|-------|
| 1 TB PCI-E 5.0 NVMe SSD | +$352 |
| 2 TB PCI-E 5.0 NVMe SSD | +$412 |
| 4 TB PCI-E 5.0 NVMe SSD | +$815 |
| 7.5 TB PCI-E 5.0 NVMe SSD | +$2,788 |
| 15 TB PCI-E 5.0 NVMe SSD | +$4,674 |
| 30 TB PCI-E 5.0 NVMe SSD | +$9,576 |
| 61.44 TB PCI-E 5.0 NVMe SSD | +$20,810 |

**SATA SSD (Up to 550 MB/s):**
| Option | Price |
|--------|-------|
| 1 TB SATA SSD | +$63 |
| 2 TB SATA SSD | +$112 |
| 4 TB SATA SSD | +$461 |
| 8 TB SATA SSD | +$856 |

### Storage - SSD #2 & Additional Storage

Similar options available for SSD #2 with slightly higher prices.

**Enterprise-Class SATA Hard Drives:**
| Option | Price |
|--------|-------|
| 4 TB HDD | +$189 |
| 10 TB HDD | +$243 |
| 14 TB HDD | +$414 |
| 18 TB HDD | +$589 |
| 22 TB HDD | +$738 |

### External Storage

| Option | Price |
|--------|-------|
| Not included | +$0 |
| 8-Bay Direct Attached Storage (USB 3.2 Type-C; software RAID) | +$750 |
| 12-Bay Network Attached Storage (2x 10G ports; RAID) | +$4,050 |

### RAID Controller

**For PCIe NVMe SSDs:**
| Option | Price |
|--------|-------|
| 4x port RAID NVMe SSD controller (PCIe 3.0) | +$839 |
| 4x port RAID NVMe SSD controller (PCIe 4.0) | +$1,146 |
| 8x port RAID NVMe SSD controller (PCIe 4.0) | +$1,999 |

**For SATA/SAS SSDs:**
| Option | Price |
|--------|-------|
| 8x port RAID SAS/SATA SSD controller (12Gb/s; PCIe 3.0) | +$599 |

### Network & Adapters

| Option | Price |
|--------|-------|
| 802.11ac WiFi + Bluetooth + 1 Gigabit Ethernet (built-in) | +$0 |
| 10 Gigabit Dual Port Ethernet (2x RJ45) | +$133 |
| 25 Gigabit Dual Port Ethernet (2x SFP28) | +$199 |
| 100 Gbps Dual Port InfiniBand EDR (Mellanox ConnectX VPI; 1x QSFP) | +$1,399 |
| Thunderbolt 4 (dual port; up to 40Gbps) | +$100 |
| Trusted Platform Module - TPM 2.0 | +$79 |

### Peripherals

**Monitors:**
| Option | Price |
|--------|-------|
| Not included | +$0 |
| 24" Full HD LCD IPS Monitor (1920x1080) | +$358 |
| 27" 4K UHD LCD IPS Monitor (3840x2160) | +$603 |
| 32" 4K UHD LCD IPS Monitor (3840x2160) | +$798 |

**Keyboard & Mouse:**
| Option | Price |
|--------|-------|
| Not included | +$0 |
| Logitech Combo MK320 Keyboard + Mouse (Wireless) | +$41 |
| Logitech Combo MK850 Performance Keyboard + Mouse (Wireless) | +$106 |

### UPS System

| Option | Price |
|--------|-------|
| Not included | +$0 |
| UPS System 1500W, AVR and LCD Display | +$1,168 |
| UPS System 3000W, AVR and LCD Display (2x 1500W) | +$2,482 |
| UPS System 6000W, AVR and LCD Display (4x 1500W) | +$5,400 |

### Warranty/Support

| Option | Price |
|--------|-------|
| Lifetime Expert Care + 3 Year Limited Warranty (3Y Labor, 1Y Parts) | +$0 (base) |
| Lifetime Expert Care + 4 Year Limited Warranty (4Y Labor, 2Y Parts) | +$1,175 |
| Lifetime Expert Care + 5 Year Limited Warranty (5Y Labor, 3Y Parts) | +$2,203 |

### Example Configuration: Dual RTX 5090 AI Workstation

| Component | Selection | Price |
|-----------|-----------|-------|
| Base System | BIZON Z5000 G2 | $14,684 |
| CPU | 32-Core Intel Xeon W7-3565X | +$2,249 |
| GPU Support | 4 GPU-Ready (3000W PSU) | +$810 |
| GPUs | 2x Liquid-cooled RTX 5090 32GB | +$11,500 |
| Memory | 128GB DDR5 ECC (2x64GB) | +$2,328 |
| OS | Ubuntu 24.04 (BIZON OS + AI Stack) | +$0 |
| SSD #1 | 2TB PCI-E 5.0 NVMe | +$412 |
| SSD #2 | 4TB SATA SSD | +$560 |
| Network | 10 Gigabit Dual Port Ethernet | +$133 |
| Warranty | 3 Year (included) | +$0 |
| **TOTAL** | | **~$32,676** |

*Note: Prices in USD. For Germany, add shipping + import duties (~15-20%).*

---

## Budget Configurations (~€15,000)

**Budget calculation:** €15,000 ≈ $16,500 USD. After shipping (~$400) + import duties (~19% VAT), target **~$12,000-13,500 USD** for the workstation.

### Comparison: BIZON Workstation Models

| Model | Base Price | CPU | Max GPUs | Cooling | Best For |
|-------|-----------|-----|----------|---------|----------|
| **X3000 G2** | $3,429 | AMD Ryzen 9000 (16 cores) | 2x RTX 5090 | CPU: Liquid, GPU: Air | Budget dual-GPU |
| **G3000** | $4,387 | Intel Xeon W (8-60 cores) | 4x RTX 6000 | CPU: Air/Liquid, GPU: Air | Multi-GPU, ECC RAM |
| **Z5000 G2** | $14,684 | Intel Xeon W (16-60 cores) | 7x RTX 5090 | CPU+GPU: Liquid | High-end, quiet |

---

### RECOMMENDED: Option A - X3000 G2 + 2x RTX 5080 (Best Value)

**Total: ~€12,000** (incl. shipping + import)

| Component | Selection | Price |
|-----------|-----------|-------|
| Base System | BIZON X3000 G2 | $3,429 |
| CPU | 16-Core AMD Ryzen 9 9950X | +$544 |
| Cooling | Liquid (CPU) - included | +$0 |
| Memory | 64GB DDR5 (2x32GB) | +$481 |
| GPU Support | 2 GPU-Ready (2200W PSU) | +$996 |
| **GPUs** | **2x NVIDIA RTX 5080 16GB** | +$3,286 |
| OS | Ubuntu 24.04 (AI Stack) | +$0 |
| SSD | 2TB PCI-E 4.0 NVMe | +$388 |
| **Subtotal** | | **$9,124** |
| Shipping to Germany | | ~$400 |
| Import (19% VAT) | | ~$1,800 |
| **TOTAL** | | **~$11,300 / ~€10,600** |

**What you get:** 32GB total VRAM (2x 16GB), 16-core CPU, liquid cooling, 64GB RAM, 2TB fast storage.

**Can run:** Llama 3.1 13B (FP16), Mistral 7B, fine-tuning up to 13B with QLoRA, Stable Diffusion XL.

---

### Option B - X3000 G2 + 1x RTX 5090 (Max Single-GPU VRAM)

**Total: ~€14,000** (incl. shipping + import)

| Component | Selection | Price |
|-----------|-----------|-------|
| Base System | BIZON X3000 G2 | $3,429 |
| CPU | 16-Core AMD Ryzen 9 9950X3D | +$692 |
| Cooling | Liquid (CPU) - included | +$0 |
| Memory | 128GB DDR5 (2x64GB) | +$1,810 |
| GPU Support | 1 GPU-Ready (1200W PSU) | +$299 |
| **GPU** | **1x NVIDIA RTX 5090 32GB** | +$4,040 |
| OS | Ubuntu 24.04 (AI Stack) | +$0 |
| SSD | 4TB PCI-E 4.0 NVMe | +$595 |
| **Subtotal** | | **$10,865** |
| Shipping + Import | | ~$2,400 |
| **TOTAL** | | **~$13,300 / ~€12,500** |

**What you get:** 32GB unified VRAM, fastest gaming CPU, 128GB RAM, 4TB storage.

**Can run:** Llama 3.1 70B (Q4), DeepSeek 32B (FP16), larger batch sizes, room to add 2nd GPU later.

---

### Option C - G3000 + 2x RTX 5080 (Intel Xeon + ECC RAM)

**Total: ~€14,000** (incl. shipping + import)

| Component | Selection | Price |
|-----------|-----------|-------|
| Base System | BIZON G3000 | $4,437 |
| CPU | 12-Core Intel Xeon W5-2545 | +$599 |
| Cooling | Liquid (CPU) | +$405 |
| Memory | 64GB DDR5 ECC (2x32GB) | +$1,008 |
| GPU Support | 2 GPU-Ready (2200W PSU) | +$443 |
| **GPUs** | **2x NVIDIA RTX 5080 16GB** | +$3,286 |
| OS | Ubuntu 24.04 (AI Stack) | +$0 |
| SSD | 2TB PCI-E 4.0 NVMe | +$388 |
| **Subtotal** | | **$10,566** |
| Shipping + Import | | ~$2,300 |
| **TOTAL** | | **~$12,900 / ~€12,100** |

**What you get:** ECC RAM (critical for long training), Intel Xeon reliability, expandable to 4 GPUs.

---

### Option D - G3000 + 1x RTX 5090 (Intel Xeon + Max VRAM)

**Total: ~€15,800** (slightly over budget)

| Component | Selection | Price |
|-----------|-----------|-------|
| Base System | BIZON G3000 | $4,437 |
| CPU | 14-Core Intel Xeon W5-2555X | +$855 |
| Cooling | Liquid (CPU) | +$405 |
| Memory | 128GB DDR5 ECC (2x64GB) | +$2,042 |
| GPU Support | 1 GPU-Ready (1200W PSU) | +$0 |
| **GPU** | **1x NVIDIA RTX 5090 32GB** | +$4,040 |
| OS | Ubuntu 24.04 (AI Stack) | +$0 |
| SSD | 2TB PCI-E 4.0 NVMe | +$388 |
| **Subtotal** | | **$12,167** |
| Shipping + Import | | ~$2,600 |
| **TOTAL** | | **~$14,800 / ~€13,900** |

**What you get:** 32GB unified VRAM, ECC RAM, Xeon reliability, expandable to 4 GPUs later.

---

### NOT Recommended for €15k Budget

| Configuration | Est. Total | Why Not |
|--------------|-----------|---------|
| X3000 G2 + 2x RTX 5090 | ~€17,500 | Over budget by €2,500 |
| G3000 + 2x RTX 5090 | ~€18,500 | Over budget by €3,500 |
| Z5000 G2 (any config) | €20,000+ | Base price alone exceeds budget |

---

### My Recommendation for €15k Budget

**Best Overall: Option A (X3000 G2 + 2x RTX 5080)** - ~€10,600
- Best price/performance ratio
- 32GB total VRAM across 2 GPUs
- AMD Ryzen 9950X is excellent for AI workloads
- Leaves ~€4,400 buffer for upgrades or second workstation

**Best for Large Models: Option B (X3000 G2 + 1x RTX 5090)** - ~€12,500
- 32GB unified VRAM (no model parallelism needed)
- Can run 70B quantized models
- Upgrade path: add 2nd RTX 5090 later for ~€5,000

**Best for Reliability: Option C (G3000 + 2x RTX 5080)** - ~€12,100
- ECC RAM prevents silent data corruption
- Intel Xeon = enterprise reliability
- Better for 24/7 training runs

---

## Pre-Built Workstation Vendor Comparison (Dual RTX 5090)

### Summary: Best Options for Dual RTX 5090 (~€15-18k)

| Vendor | Location | Dual RTX 5090 Price | Includes VAT | Import Duties | Best For |
|--------|----------|---------------------|--------------|---------------|----------|
| **🏆 Kiebel.de** | Germany | **€15,999** | ✅ Yes | ✅ None | Best value, no import hassle |
| BIZON X3000 G2 | USA | ~€17,500 | ❌ No | +19% VAT | Liquid-cooled GPUs |
| BIZON G3000 | USA | ~€18,500 | ❌ No | +19% VAT | Intel Xeon + ECC |
| Puget Systems | USA | N/A | - | - | **No RTX 5090 offered** |

---

### 🏆 BEST VALUE: Kiebel.de (Germany)

**Price: €15,999** (including 19% VAT, no import duties)

[Kiebel Dual RTX 5090 Workstation](https://www.kiebel.de)

| Component | Specification |
|-----------|--------------|
| **GPUs** | 2x NVIDIA GeForce RTX 5090 32GB |
| **CPU** | AMD Threadripper PRO 7965WX (24 cores, 4.2 GHz) |
| **Motherboard** | ASUS PRO WS WRX90E-SAGE SE |
| **RAM** | 128GB DDR5 ECC |
| **PSU** | Seasonic Prime PX-2200W (ATX 3.1) |
| **Storage** | Samsung 990 PRO 1TB NVMe |
| **Cooling** | Air-cooled |
| **Warranty** | German consumer protection (2 years) |

**Pros:**
- ✅ Cheapest dual RTX 5090 option found
- ✅ No import duties (German seller)
- ✅ VAT included in price
- ✅ AMD Threadripper PRO with 88 PCIe 5.0 lanes
- ✅ ECC RAM for training stability
- ✅ German warranty/support

**Cons:**
- ❌ Air-cooled GPUs (louder than liquid)
- ❌ Only 1TB storage (need to add more)

---

### BIZON X3000 G2 + 2x RTX 5090 (USA)

**Price: ~€17,500** (after shipping + 19% import VAT)

| Component | Specification | Price |
|-----------|--------------|-------|
| Base System | X3000 G2 | $3,429 |
| CPU | AMD Ryzen 9 9950X (16 cores) | +$544 |
| Memory | 128GB DDR5 | +$1,810 |
| GPU Support | 2 GPU-Ready (2200W PSU) | +$996 |
| **GPUs** | **2x Liquid-cooled RTX 5090** | +$8,080 |
| Storage | 2TB NVMe | +$388 |
| **Subtotal** | | **$15,247** |
| Shipping | | ~$400 |
| Import (19% VAT) | | ~$2,950 |
| **TOTAL** | | **~$18,600 / ~€17,500** |

**Pros:**
- ✅ Liquid-cooled GPUs (quieter, better thermals)
- ✅ Custom AI software stack pre-installed
- ✅ Excellent support for AI workloads

**Cons:**
- ❌ €2,500 more expensive than Kiebel
- ❌ Import duties + customs process
- ❌ Consumer AMD Ryzen (not Threadripper)

---

### BIZON G3000 + 2x RTX 5090 (USA)

**Price: ~€18,500** (after shipping + 19% import VAT)

| Component | Specification | Price |
|-----------|--------------|-------|
| Base System | G3000 | $4,437 |
| CPU | Intel Xeon W5-2555X (14 cores) | +$855 |
| Memory | 128GB DDR5 ECC | +$2,042 |
| GPU Support | 2 GPU-Ready (2200W PSU) | +$443 |
| **GPUs** | **2x NVIDIA RTX 5090** | +$8,080 |
| Storage | 2TB NVMe | +$388 |
| **Subtotal** | | **$16,245** |
| Shipping + Import | | ~$3,400 |
| **TOTAL** | | **~$19,650 / ~€18,500** |

**Pros:**
- ✅ Intel Xeon + ECC RAM (enterprise reliability)
- ✅ Expandable to 4 GPUs later
- ✅ Air-cooled GPUs (simpler maintenance)

**Cons:**
- ❌ Most expensive option
- ❌ Import duties + customs process
- ❌ Fewer PCIe lanes than Threadripper

---

### Puget Systems Multi GPU Xeon Workstation (USA)

**RTX 5090 NOT AVAILABLE** - Only offers RTX PRO series (workstation GPUs)

| Configuration | Price | Notes |
|--------------|-------|-------|
| 2x RTX 5080 16GB | ~$17,723 | Consumer GPUs available |
| 2x RTX PRO 6000 96GB | $32,265 | Professional/data center |
| 2x RTX PRO 5000 48GB | ~$23,500 | Professional workstation |

**Why no RTX 5090?** Puget Systems focuses on professional/workstation GPUs (RTX PRO series) rather than consumer gaming cards. Good for enterprise customers but not ideal for budget-conscious AI researchers.

---

### Final Recommendation: Dual RTX 5090 Workstation

| Priority | Recommendation | Price |
|----------|---------------|-------|
| **Best Value** | **Kiebel.de** (Germany) | **€15,999** |
| Best Cooling | BIZON X3000 G2 | ~€17,500 |
| Best Reliability | BIZON G3000 (Xeon + ECC) | ~€18,500 |
| Professional/Enterprise | Puget Systems (RTX PRO) | $23,000+ |

**My Recommendation:** Go with **Kiebel.de at €15,999**. You save €1,500-2,500 compared to US vendors, avoid import hassles, get German warranty protection, and the Threadripper PRO platform is actually superior to consumer Ryzen for multi-GPU workloads (88 PCIe lanes vs 28).

The only upgrade to consider: add a 4TB SATA SSD (~€200) for dataset storage.

---

## Sources

- [BIZON X3000 G2 Configurator](https://bizon-tech.com/bizon-x3000.html#customize)
- [BIZON G3000 Configurator](https://bizon-tech.com/bizon-g3000.html#customize)
- [BIZON Z5000 G2 Configurator](https://bizon-tech.com/bizon-z5000.html#customize)
- [BIZON RTX 5090 vs 4090 Comparison](https://bizon-tech.com/blog/nvidia-rtx-5090-comparison-gpu-benchmarks-for-ai)
- [Local AI Master Hardware Guide 2025](https://localaimaster.com/blog/ai-hardware-requirements-2025-complete-guide)
- [Tom's Hardware PSU Requirements](https://www.tomshardware.com/pc-components/power-supplies/what-sort-of-power-supply-do-you-actually-need-for-an-rtx-5090)
- [Geizhals Deutschland RTX 5090 Prices](https://geizhals.de/nvidia-geforce-rtx-5090-founders-edition-a3381601.html)
- [SabrePC Best GPUs for AI](https://www.sabrepc.com/blog/deep-learning-ai/best-gpus-for-ai)
- [Newegg CPU Comparison Guide](https://www.newegg.com/insider/epyc-vs-xeon-vs-threadripper-pro-what-should-you-use-for-ai-virtualization-and-storage/)
- [Medium: RTX 5090 vs 4090 AI Testing](https://medium.com/data-science-in-your-pocket/tested-nvidia-rtx-5090-vs-4090-gpus-for-ai-you-wont-believe-the-winner-8f649b246b86)
- [Level1Techs Dual 5090 Forum](https://forum.level1techs.com/t/psu-and-motherboard-for-a-dual-5090-workstation/225377)
- [Kiebel.de AI Workstations](https://www.kiebel.de)
- [Puget Systems Multi GPU Workstation](https://www.pugetsystems.com/solutions/ai/develop/buy-200/)
- [NVLink on Consumer GPUs - OTOY Docs](https://docs.otoy.com/standaloneSE/NVLinkonConsumerGPUs.html)
- [SabrePC: NVLink vs PCIe for Multi-GPU](https://www.sabrepc.com/blog/computer-hardware/nvlink-vs-pcie-do-you-need-nvlink-for-multi-gpu)
- [NVIDIA RTX A6000 NVLink](https://www.nvidia.com/en-us/products/workstations/rtx-a6000/)
- [RTX A6000 Ada - No NVLink Discussion](https://forums.developer.nvidia.com/t/rtx-a6000-ada-no-more-nv-link-even-on-pro-gpus/230874)
- [Kleinanzeigen.de - RTX 3090 Used Market](https://www.kleinanzeigen.de/s-pc-zubehoer-software/grafikkarten/rtx-3090/k0c225+pc_zubehoer_software.art_s:grafikkarten)
- [BIZON G9000 NVLink Server](https://bizon-tech.com/bizon-g9000.html)
