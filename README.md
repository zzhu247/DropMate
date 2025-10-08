# 🚚 DropMate — Cloud-Native Local Delivery Platform

**DropMate** is a scalable, cloud-native delivery management system that lets customers:
- View ads and promotions  
- Place and confirm orders (via web or WeChat)  
- Track deliveries with real-time ETA updates  
- Communicate through a message board  
- Automatically receive daily dispatch summaries  

The project demonstrates modern **cloud computing practices**:
- 🐳 **Docker** containerization  
- ☸️ **Kubernetes** orchestration  
- 💾 **PostgreSQL** with persistent storage  
- 📊 **Monitoring** via Prometheus & Grafana  
- ☁️ **Deployment** on DigitalOcean (DOKS) or Fly.io  

---

## ⚙️ Quick Start (Local Demo)

```bash
cd compose
docker-compose up --build
```

**Services**
- Frontend: [http://localhost:3001](http://localhost:3001)  
- API: [http://localhost:3000](http://localhost:3000)  
- PostgreSQL: `localhost:5432`  
- Redis: `localhost:6379`  

---

## ☁️ Cloud Stack (Production)

- **Frontend:** Next.js  
- **Backend:** Node.js / NestJS  
- **Database:** Managed PostgreSQL (HA)  
- **Queue:** Redis + BullMQ  
- **Storage:** DigitalOcean Spaces  
- **Monitoring:** Prometheus + Grafana  
- **CI/CD:** GitHub Actions → DOKS  

---

## 📆 Milestones

| Phase | Deliverable | Status |
|--------|--------------|--------|
| Core Features | Ads, Orders, Delivery ETA | 🔄 In Progress |
| Orchestration | Docker Compose + K8s Setup | 🔄 In Progress |
| Monitoring & Cloud Deploy | Prometheus + DOKS | 🔄 In Progress |
| Advanced Features | Route Optimization, Push Alerts | ⏳ Planned |

---

## 📄 Docs & Resources

- [📘 Detailed Design Document](./designDoc.md)
- [⚙️ Kubernetes Configs](./k8s/)
- [🐳 Docker Compose Setup](./compose/)
- [🎥 Demo Video (Coming Soon)](./demo/)
