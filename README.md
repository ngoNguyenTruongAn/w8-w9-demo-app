# W8-W9: GitOps, Observability & Canary Deployment with ArgoCD, Prometheus, Grafana and Argo Rollouts

## 1. Mục tiêu

Triển khai ứng dụng theo mô hình GitOps sử dụng ArgoCD.

Tích hợp hệ thống Observability với:

* Prometheus
* Grafana
* ServiceMonitor

Triển khai Canary Deployment sử dụng Argo Rollouts.

Toàn bộ thay đổi được thực hiện thông qua Git push và ArgoCD tự động đồng bộ vào Kubernetes Cluster.

---

# 2. Kiến trúc tổng quan

```text
GitHub
   │
   ▼
ArgoCD (GitOps)
   │
   ▼
Kubernetes Cluster
   │
   ├── Demo Application
   │      ├── Frontend
   │      └── Backend (/metrics)
   │
   ├── Prometheus
   │
   ├── Grafana
   │
   └── Argo Rollouts
```


# 3. Cài đặt GitOps bằng ArgoCD

## Mục tiêu

* Quản lý Kubernetes bằng GitOps
* Tự động sync khi có thay đổi trên GitHub

## Thực hiện

Tạo các Application:

* root-app
* monitoring
* demo-app
* argo-rollouts

### Kiểm tra

```bash
kubectl get applications -n argocd
```

## Evidence
![Application](./Evidence/Application.jpg)
### Screenshot

![ArgoCD Dashboard](./Evidence/ArgoCD%20Dashboard.jpg)

# 4. Monitoring Stack

## Thành phần

### Prometheus

Thu thập metrics từ cluster và ứng dụng.

### Grafana

Trực quan hóa metrics.

### ServiceMonitor

Cho phép Prometheus scrape metrics từ ứng dụng.

---

## Kiểm tra Pod Monitoring

```bash
kubectl get pods -n monitoring
```

## Evidence
![pod monitoring](./Evidence/pod%20monitoring.jpg)


# 5. Demo Application

## Thành phần

### Frontend

* Nginx
* Port 80

### Backend

* NodeJS Express
* Port 5000

API:

```text
GET /api/health
GET /api/message
GET /metrics
```

---

## Health Check

### Kiểm tra

```bash
curl http://localhost:5000/api/health
```
## Evidence
![Health Check](./Evidence/Health%20Check.jpg)


---

## Message API

### Kiểm tra

```bash
curl http://localhost:5000/api/message
```
## Evidence
![message Check](./Evidence/message%20Check.jpg)

---

# 6. Prometheus Metrics

## Mục tiêu

Expose custom metric:

```text
demo_http_requests_total
```

---

## Kiểm tra Metrics Endpoint

```bash
curl http://localhost:5000/metrics
```

## Evidence

![Metrics Endpoint](./Evidence/Metrics%20Endpoint.jpg)

---

## Sinh Traffic

```bash
curl http://localhost:5000/api/message
curl http://localhost:5000/api/message
curl http://localhost:5000/api/message
```

---

## Verify Counter

```bash
curl.exe http://localhost:5000/metrics | findstr demo_http
```
## Evidence
![Verify Counter](./Evidence/Verify%20Counter.jpg)

---
## Chạy app
![Chạy app](./Evidence/Chạy%20app.jpg)

# 7. ServiceMonitor

## Mục tiêu

Cho phép Prometheus scrape metrics từ namespace demo.

---

## Kiểm tra

```bash
kubectl get servicemonitor -A
```

## Evidence
![servicemonitor](./Evidence/servicemonitor.jpg)

# 8. Verify Prometheus Scrape

## Query

```promql
demo_http_requests_total
```

## Evidence
![Prometheus Query](./Evidence/Prometheus%20Query.jpg)

# 9. Grafana Dashboard

## Mục tiêu

Grafana được tích hợp với Prometheus để trực quan hóa các metrics của ứng dụng trong namespace `demo`.

Dashboard giúp theo dõi:

- Số lượng Pod đang hoạt động.
- Mức sử dụng bộ nhớ của từng Pod.
- Lưu lượng HTTP Request đi vào Backend API.
- Hỗ trợ quan sát trạng thái hệ thống trong quá trình Canary Deployment và GitOps rollout.

---

## Dashboard xây dựng

### 1. Running Pod Count

**Ý nghĩa**

Hiển thị số lượng Pod đang ở trạng thái `Running` trong namespace `demo`.

Dashboard này giúp:

- Xác nhận ứng dụng đang hoạt động.
- Quan sát sự thay đổi số lượng Pod khi Rollout hoặc Scale.
- Kiểm tra nhanh tình trạng sẵn sàng của workload.

**PromQL**

```promql
count(
  kube_pod_status_phase{
    namespace="demo",
    phase="Running"
  }
)
```

### 2. Memory Usage

Ý nghĩa

Hiển thị lượng RAM đang được sử dụng bởi từng Pod của ứng dụng.

Dashboard này giúp:

Theo dõi mức tiêu thụ bộ nhớ của Backend và Frontend.
Phát hiện Pod có dấu hiệu sử dụng bộ nhớ bất thường.
Là cơ sở để điều chỉnh Resource Requests/Limits.

PromQL
```
sum by (pod) (
  container_memory_working_set_bytes{
    namespace="demo",
    container!="",
    container!="POD"
  }
)
```

### 3. HTTP Requests

Ý nghĩa

Hiển thị tốc độ request được ghi nhận từ custom metric demo_http_requests_total.

Metric này được expose bởi Backend thông qua endpoint:

/metrics

và được Prometheus scrape thông qua ServiceMonitor.

Dashboard này giúp:

Xác nhận Prometheus đã thu thập được custom metric.
Theo dõi lưu lượng truy cập vào API.
Chứng minh luồng Observability hoạt động đầy đủ:
Application → Prometheus → Grafana.

PromQL
```
sum by (route) (
  rate(demo_http_requests_total[5m])
)
```
### Evidence
![Dashboard Overview](./Evidence/Dashboard%20Overview.jpg)


# 10. Canary Deployment với Argo Rollouts

## Chiến lược

```yaml
steps:
  - setWeight: 25
  - pause: {}

  - setWeight: 50
  - pause:
      duration: 30s

  - setWeight: 100
```

---

# 11. Canary 25%

## Thay đổi

```yaml
APP_VERSION=v1
```

↓

```yaml
APP_VERSION=v2
```

Push Git.

ArgoCD tự sync.

---

## Kiểm tra

```bash
kubectl describe rollout demo-app -n demo
```

## Evidence
![Pause 25%](./Evidence/Pause%2025%25.jpg)

---
# 13. Promote Canary

## Tiếp tục rollout

Promote rollout.

---

## Kiểm tra

```bash
kubectl describe rollout demo-app -n demo
```

### Kết quả

```text
Rollout step 3/5 completed (setWeight: 50)
```

## Evidence
![Promote Canary](./Evidence/Promote%20Canary.jpg)


---

# 14. Rollout 100%

## Kiểm tra

```bash
kubectl describe rollout demo-app -n demo
```

### Kết quả

```text
Rollout step 5/5 completed (setWeight: 100)
```

## Evidence

![Rollout 100%](./Evidence/Rollout%20100%25.jpg)

---

# 15. Rollout Completed

## Kiểm tra

```bash
kubectl describe rollout demo-app -n demo
```

### Kết quả

```text
Rollout completed update to revision
Completed all 5 canary steps
```

## Evidence

![Rollout Completed](./Evidence/Rollout%20Completed.jpg)

---

# 16. ReplicaSet Verification

## Kiểm tra

```bash
kubectl get rs -n demo
```

### Kết quả

```text
demo-app-new-rs  2
demo-app-old-rs  0
```

Ý nghĩa:

* 100% traffic sang phiên bản mới
* Phiên bản cũ không còn phục vụ traffic

## Evidence
![ReplicaSet Verification](./Evidence/ReplicaSet%20Verification.jpg)


---

# 17. Kết quả đạt được

## GitOps

✅ ArgoCD

✅ App of Apps

✅ Automatic Sync

---

## Observability

✅ Prometheus

✅ Grafana

✅ ServiceMonitor

✅ Custom Metrics

---

## Canary Deployment

✅ Rollout

✅ Canary 25%

✅ Manual Approval

✅ Promote

✅ Rollout 100%

✅ Completed

---

# 18. Bài học rút ra

* GitOps giúp đồng bộ trạng thái cluster từ Git.
* Prometheus + Grafana cung cấp khả năng quan sát hệ thống theo thời gian thực.
* ServiceMonitor giúp tích hợp ứng dụng với Prometheus dễ dàng.
* Argo Rollouts hỗ trợ Canary Deployment an toàn hơn Deployment mặc định của Kubernetes.
* Canary Deployment cho phép giảm rủi ro khi phát hành phiên bản mới.
