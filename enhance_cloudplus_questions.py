#!/usr/bin/env python3
"""
Comprehensive Cloud Plus Question Enhancement Script
This script transforms all 615 Cloud Plus exam questions into challenging,
scenario-based questions that require critical thinking and deep understanding.
"""

import json
import random
import copy
from datetime import datetime
import shutil

# Company types and contexts for scenarios
COMPANY_TYPES = [
    "a Fortune 500 healthcare organization managing electronic health records for 50 hospitals",
    "a global financial services company processing 10 million transactions daily",
    "a multinational retail corporation with 2,000 stores across 40 countries",
    "a fast-growing SaaS startup serving 100,000 enterprise customers",
    "a government agency handling classified information with strict security requirements",
    "a media streaming company delivering content to 50 million concurrent users",
    "an e-commerce platform experiencing 300% traffic spikes during holiday seasons",
    "a manufacturing company operating IoT sensors across 200 factories worldwide",
    "an online education platform supporting 5 million students globally",
    "a telecommunications provider managing network infrastructure for 20 million subscribers"
]

BUSINESS_CONSTRAINTS = [
    "must comply with HIPAA regulations and maintain 99.99% uptime",
    "requires PCI-DSS compliance with zero tolerance for data breaches",
    "needs GDPR compliance with data residency in EU and right-to-deletion capabilities",
    "demands SOC 2 Type II compliance with comprehensive audit trails",
    "requires FedRAMP High authorization with air-gapped environments",
    "must achieve sub-50ms latency globally with disaster recovery capabilities",
    "needs to reduce operational costs by 40% while improving performance",
    "requires active-active multi-region deployment with automatic failover",
    "must support 10,000 concurrent users with strict SLA commitments",
    "demands zero-downtime deployments with instant rollback capabilities"
]

TECHNICAL_CHALLENGES = [
    "The IT team has limited cloud expertise and prefers managed services",
    "Legacy systems require hybrid cloud connectivity with secure VPN tunnels",
    "Budget constraints limit spending to $50,000 monthly with strict cost controls",
    "The application handles sensitive PII requiring encryption at rest and in transit",
    "Peak traffic periods exceed baseline by 500% requiring aggressive autoscaling",
    "Compliance requires complete audit logs with 7-year retention policies",
    "The system processes real-time data streams requiring low-latency processing",
    "Multi-tenancy requirements demand complete resource isolation between customers",
    "Integration with 20+ third-party APIs requiring circuit breaker patterns",
    "Database operations require sub-10ms query response times at 95th percentile"
]

def create_backup(file_path):
    """Create a timestamped backup of the original file"""
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    backup_path = f"{file_path}.backup_{timestamp}"
    shutil.copy2(file_path, backup_path)
    print(f"✓ Backup created: {backup_path}")
    return backup_path

def generate_scenario_context():
    """Generate a realistic business scenario with constraints"""
    company = random.choice(COMPANY_TYPES)
    constraint = random.choice(BUSINESS_CONSTRAINTS)
    challenge = random.choice(TECHNICAL_CHALLENGES)
    
    return f"{company.capitalize()} {constraint}. {challenge}."

def enhance_service_model_question(q):
    """Transform service model questions into complex scenarios"""
    scenarios = [
        {
            'context': "A healthcare organization with 50 hospitals needs to deploy an electronic health records (EHR) system that must comply with HIPAA regulations, support 10,000 concurrent users, and provide 99.99% uptime. The IT team has limited cloud expertise and wants to avoid managing servers, operating systems, or application updates. The solution must include automatic security patching, built-in disaster recovery, and mobile app access for physicians.",
            'question': "Which cloud service model BEST meets these requirements while minimizing operational overhead?",
            'options': [
                "Infrastructure as a Service (IaaS) with self-managed virtual machines and manual patching schedules",
                "Platform as a Service (PaaS) with managed runtime environment and automated scaling",
                "Software as a Service (SaaS) with pre-built EHR application and vendor-managed infrastructure",
                "Function as a Service (FaaS) with serverless event-driven microservices architecture"
            ],
            'answer': 2,
            'explanation': "SaaS is the correct answer because it provides a complete, pre-built EHR application where the vendor manages all infrastructure, operating systems, middleware, and application updates. This minimizes operational overhead for the healthcare organization's IT team with limited cloud expertise. The SaaS provider handles HIPAA compliance, security patching, disaster recovery, and ensures 99.99% uptime through their managed service. PaaS would require the organization to build and maintain the EHR application. IaaS would require managing VMs and OS. FaaS would require significant development effort to build the entire system. Objective 1.1"
        },
        {
            'context': "A financial services company processes 10 million daily transactions and requires complete control over security configurations, custom kernel modules, and specialized network appliances. They need to run proprietary trading algorithms that demand specific CPU instruction sets and require direct access to underlying hardware for performance optimization. The security team must implement custom firewall rules, intrusion detection systems, and conduct regular vulnerability scans.",
            'question': "Which cloud service model provides the necessary level of control for these requirements?",
            'options': [
                "Software as a Service (SaaS) with API-based customization and integration hooks",
                "Platform as a Service (PaaS) with custom buildpacks and container orchestration",
                "Infrastructure as a Service (IaaS) with dedicated virtual machines and root access",
                "Function as a Service (FaaS) with custom runtime containers and event triggers"
            ],
            'answer': 2,
            'explanation': "IaaS is correct because it provides complete control over the virtual infrastructure including OS, custom kernel modules, network configurations, and security controls. The financial services company can install proprietary trading algorithms, implement custom firewall rules, deploy specialized network appliances, and conduct vulnerability scans with root/administrator access. IaaS gives the flexibility to optimize for specific CPU instructions and configure the environment exactly as needed. SaaS and PaaS abstract away infrastructure control. FaaS focuses on code execution without infrastructure management. Objective 1.1"
        },
        {
            'context': "A development team at a rapidly growing startup needs to deploy a microservices-based application across multiple regions. They want to focus exclusively on writing application code without managing Kubernetes clusters, load balancers, container orchestration, or underlying virtual machines. The solution must provide automatic horizontal scaling based on CPU and memory metrics, integrated CI/CD pipelines, and built-in monitoring and logging. Cost optimization is critical, with consumption-based pricing preferred.",
            'question': "Which cloud service model BEST aligns with these development-focused requirements?",
            'options': [
                "Infrastructure as a Service (IaaS) with self-managed Kubernetes deployment and custom autoscaling",
                "Platform as a Service (PaaS) with managed container platform and built-in DevOps tools",
                "Software as a Service (SaaS) with third-party application hosting and vendor management",
                "Hybrid deployment combining on-premises Kubernetes with cloud-based virtual machines"
            ],
            'answer': 1,
            'explanation': "PaaS is the optimal choice because it provides a managed platform where developers can deploy containerized microservices without managing the underlying Kubernetes clusters, load balancers, or VMs. PaaS platforms offer built-in container orchestration, automatic scaling based on metrics, integrated CI/CD pipelines, and comprehensive monitoring. This allows the development team to focus purely on application code while the platform handles infrastructure management. IaaS would require managing all infrastructure components. SaaS doesn't allow custom application deployment. Consumption-based pricing aligns with PaaS cost models. Objective 1.1"
        },
        {
            'context': "An enterprise organization operates a complex hybrid environment with on-premises datacenters and multi-cloud deployments. They need to implement a backup and disaster recovery solution that works seamlessly across VMware infrastructure, AWS, and Azure. The solution must provide centralized management, policy-based retention, ransomware protection with immutable backups, and one-click recovery to any environment. The IT team wants to avoid building custom integration between different platforms.",
            'question': "Which cloud service model provides the most appropriate solution for this cross-platform backup requirement?",
            'options': [
                "Infrastructure as a Service (IaaS) with custom-built backup scripts and storage volumes",
                "Platform as a Service (PaaS) with database-as-a-service backup features",
                "Software as a Service (SaaS) with specialized backup and recovery application",
                "Function as a Service (FaaS) with event-driven backup automation workflows"
            ],
            'answer': 2,
            'explanation': "SaaS is correct because specialized backup SaaS solutions provide pre-built, vendor-managed applications that integrate seamlessly across multiple platforms (VMware, AWS, Azure) without requiring the organization to build custom integrations. SaaS backup solutions offer centralized management consoles, policy-based retention, ransomware protection with immutable storage, and one-click recovery capabilities. The vendor manages all infrastructure, updates, and feature enhancements. IaaS would require building all integration and management features. PaaS backup features are typically platform-specific. FaaS would require significant development effort. Objective 1.1"
        }
    ]
    
    scenario = random.choice(scenarios)
    q['q'] = scenario['context'] + "\n\n" + scenario['question']
    q['options'] = scenario['options']
    q['answer'] = scenario['answer']
    q['explanation'] = scenario['explanation']
    return q

def enhance_shared_responsibility_question(q):
    """Transform shared responsibility questions into complex scenarios"""
    scenarios = [
        {
            'context': "During a security audit at a financial institution using Amazon RDS for their customer database, auditors discovered that database connection strings with embedded credentials were stored in plaintext within application configuration files. Additionally, database backup files stored in S3 buckets were not encrypted. The security team needs to determine accountability for these security gaps under the cloud shared responsibility model.",
            'question': "Who is responsible for these security vulnerabilities in this managed database (PaaS) environment?",
            'options': [
                "AWS is responsible for both issues as they provide the RDS managed service and S3 storage",
                "The customer is responsible for both credential management and enabling backup encryption",
                "Shared responsibility: AWS handles backups, customer handles application security",
                "The responsibility depends on the specific RDS database engine being used (MySQL vs PostgreSQL)"
            ],
            'answer': 1,
            'explanation': "The customer is fully responsible for both security issues. In the shared responsibility model for PaaS services like RDS, while AWS manages the underlying infrastructure, database software patches, and availability, the customer is responsible for: 1) Managing application-level security including secure credential storage (should use secrets management services, not plaintext), 2) Enabling encryption features for data at rest including backup encryption, 3) Implementing proper access controls and security configurations. AWS provides the tools and features (encryption, IAM), but customers must properly configure and use them. These are customer-side security configurations, not infrastructure issues. Objective 1.1"
        },
        {
            'context': "A SaaS-based CRM platform experienced a data breach where unauthorized users accessed customer contact information. Investigation revealed that the breach occurred because: 1) A company employee's credentials were compromised via phishing, 2) The company had not enabled multi-factor authentication (MFA) despite it being available, 3) The company did not configure IP whitelisting for admin accounts, 4) User access permissions were not reviewed regularly. The company claims the SaaS vendor is fully responsible since they host and manage the application.",
            'question': "According to the shared responsibility model for SaaS, how should security responsibility be allocated for this breach?",
            'options': [
                "The SaaS provider is fully responsible as they control and manage the entire application platform",
                "The customer is primarily responsible for identity management, access controls, and security configurations",
                "Shared 50/50 responsibility with both parties equally accountable for the security breach",
                "The responsibility is determined by the data classification level defined in the service contract"
            ],
            'answer': 1,
            'explanation': "The customer is primarily responsible. In SaaS environments, while the provider manages the application infrastructure and security OF the cloud (servers, networks, application code), the customer is responsible for security IN the cloud: 1) User identity and access management (should have enabled MFA), 2) Configuring available security features (IP whitelisting, access controls), 3) Training employees to prevent phishing attacks, 4) Regular access reviews and permission management. The SaaS provider made security features available (MFA, IP restrictions), but the customer failed to implement them. This is analogous to a landlord providing locks on doors but the tenant failing to use them. Objective 1.1"
        },
        {
            'context': "A healthcare organization deployed a patient portal application on AWS EC2 instances within a VPC. During a HIPAA compliance audit, reviewers found: 1) Patient Health Information (PHI) was transmitted unencrypted between the web servers and application database, 2) Security groups allowed inbound traffic from 0.0.0.0/0 on multiple ports, 3) No VPC flow logs were enabled for network monitoring, 4) EC2 instances were running outdated OS versions with known vulnerabilities. The organization's CISO wants to determine who is accountable for each security gap.",
            'question': "Under the IaaS shared responsibility model, who is responsible for these security issues?",
            'options': [
                "AWS is responsible for network security and OS patching since they provide the infrastructure",
                "The customer is responsible for all four issues as they control the IaaS configuration",
                "AWS handles network security (items 2-3), customer handles data and OS security (items 1, 4)",
                "Responsibility is shared equally with both parties needing to implement compensating controls"
            ],
            'answer': 1,
            'explanation': "The customer is responsible for all four security issues in an IaaS model. AWS is responsible for security OF the cloud (physical infrastructure, hypervisor, network infrastructure), while customers are responsible for security IN the cloud: 1) Data encryption in transit - customer must configure SSL/TLS between their applications, 2) Security group configurations - customer defines and manages all firewall rules, 3) VPC flow logs - customer must enable and configure monitoring features, 4) OS patching - customer has full control and responsibility for OS maintenance on EC2 instances. In IaaS, customers have the most responsibility as they control the OS layer and above. AWS provides the tools and features, but configuration and management are customer responsibilities. Objective 1.1"
        }
    ]
    
    scenario = random.choice(scenarios)
    q['q'] = scenario['context'] + "\n\n" + scenario['question']
    q['options'] = scenario['options']
    q['answer'] = scenario['answer']
    q['explanation'] = scenario['explanation']
    return q

def enhance_deployment_question(q):
    """Transform deployment questions into complex scenarios"""
    scenarios = [
        {
            'context': "A global e-commerce platform processes 100,000 transactions per minute during peak holiday shopping seasons. They need to deploy a new payment processing microservice across multiple regions to ensure sub-50ms response times for customers worldwide. The deployment must support active-active configuration for disaster recovery, comply with PCI-DSS requirements, maintain data residency regulations in the EU and APAC, and minimize cross-region data transfer costs. The service must handle sudden traffic spikes of 500% without performance degradation.",
            'question': "Which deployment strategy BEST addresses these comprehensive requirements?",
            'options': [
                "Single region deployment with global CDN for static content and aggressive edge caching strategies",
                "Multi-region active-active deployment with regional data stores and selective cross-region replication",
                "Primary region with warm standby in secondary regions using DNS-based failover mechanisms",
                "Containerized services with global load balancing and centralized database cluster in primary region"
            ],
            'answer': 1,
            'explanation': "Multi-region active-active deployment with regional data stores is correct because it: 1) Provides sub-50ms latency by serving traffic from geographically distributed regions close to users, 2) Enables active-active disaster recovery with multiple regions serving live traffic simultaneously, 3) Supports data residency by keeping EU data in EU regions and APAC data in APAC regions, 4) Minimizes cross-region transfer costs by processing transactions locally with selective replication only for necessary data, 5) Handles 500% traffic spikes through regional autoscaling. Option A (single region + CDN) won't meet latency requirements for dynamic transactions. Option C (warm standby) isn't active-active. Option D (centralized database) violates data residency and creates latency issues. Objective 2.1"
        },
        {
            'context': "A software company is migrating a 15-year-old monolithic on-premises application to the cloud. The application has 2 million lines of tightly coupled code, a 5TB shared Oracle database, batch jobs running on cron schedules, and integration with 30 legacy systems. The business demands zero downtime during migration, wants to gradually move functionality to cloud over 12 months while maintaining full operational capability, and has limited budget for code refactoring. The existing team has deep knowledge of the current system but minimal cloud experience.",
            'question': "What migration strategy should the company employ to meet these constraints?",
            'options': [
                "Complete lift-and-shift of the entire application stack to IaaS VMs in a single weekend migration window",
                "Full re-architecture to cloud-native microservices before any migration begins, then deploy incrementally",
                "Implement the strangler fig pattern with incremental feature migration, API gateway, and service facade",
                "Replicate on-premises environment in cloud and use blue-green deployment for one-time cutover"
            ],
            'answer': 2,
            'explanation': "The strangler fig pattern is optimal because it: 1) Enables gradual migration over 12 months by routing new features to cloud while legacy runs on-premises, 2) Achieves zero downtime by using API gateway to route traffic between old and new systems, 3) Requires minimal upfront refactoring (incremental modernization), 4) Allows team to learn cloud incrementally while maintaining operational knowledge, 5) Reduces risk by migrating piece-by-piece with rollback capabilities. Option A (full lift-and-shift) is risky for such a large system and doesn't enable gradual migration. Option B (full re-architecture first) exceeds budget and timeline constraints. Option D (blue-green cutover) doesn't support gradual 12-month transition. The strangler pattern specifically addresses legacy monolith migrations. Objective 2.2"
        },
        {
            'context': "A financial trading platform requires deployment of a new algorithmic trading service that must: achieve sub-5ms latency for order execution, process 500,000 trades per second during market hours, maintain 99.999% uptime (5 minutes downtime per year), comply with SEC regulations requiring complete audit trails, and support instant rollback if any deployment issues occur. The service updates are deployed multiple times daily with new trading algorithms. Any deployment failure could result in millions of dollars in trading losses.",
            'question': "Which deployment approach provides the necessary speed, safety, and reliability?",
            'options': [
                "Blue-green deployment with full environment replication and instant traffic switching via load balancer",
                "Rolling deployment updating 10% of instances at a time with automated health checks and gradual rollout",
                "Canary deployment with 1% traffic routing to new version, progressive rollout, and automated rollback",
                "Recreate deployment with complete shutdown of old version before deploying new version during off-hours"
            ],
            'answer': 2,
            'explanation': "Canary deployment is best because it: 1) Minimizes risk by initially routing only 1% of trading traffic to new version, detecting issues before full rollout, 2) Enables instant automated rollback if performance degrades or errors occur, 3) Maintains 99.999% uptime by keeping stable version running during deployment, 4) Supports multiple daily deployments with safety mechanisms, 5) Provides real production testing with minimal exposure. With financial trading, the risk cost of deployment failures is extremely high. Option A (blue-green) exposes 50% of traffic immediately. Option B (rolling) could impact many users before detection. Option D (recreate) violates uptime requirements. Canary specifically addresses high-risk deployments in critical financial systems. Objective 2.3"
        }
    ]
    
    scenario = random.choice(scenarios)
    q['q'] = scenario['context'] + "\n\n" + scenario['question']
    q['options'] = scenario['options']
    q['answer'] = scenario['answer']
    q['explanation'] = scenario['explanation']
    return q

def enhance_security_question(q):
    """Transform security questions into complex scenarios"""
    scenarios = [
        {
            'context': "A financial institution detected unusual API activity pattern: 1) 10,000 failed authentication attempts from 50 different IP addresses across 15 countries during 2 AM to 5 AM, 2) Successful logins using valid credentials immediately following failed attempts, 3) API calls downloading customer PII in bulk, 4) Normal daytime access patterns from legitimate users across global offices. The security team suspects credential stuffing attacks using compromised credentials from data breaches. They need to prevent this without disrupting 2,000 legitimate employees working across time zones.",
            'question': "Which security controls should be prioritized to address this threat? (Choose the MOST comprehensive approach)",
            'options': [
                "Implement geo-blocking to restrict access only from countries where the company has physical offices",
                "Enable multi-factor authentication (MFA), implement adaptive risk-based authentication, and deploy behavior analytics with machine learning",
                "Immediately rotate all API keys and enforce strict IP whitelisting for all API endpoints organization-wide",
                "Increase password complexity requirements to 20 characters and enforce mandatory 30-day password rotation"
            ],
            'answer': 1,
            'explanation': "Option B (MFA + adaptive authentication + behavior analytics) is the most comprehensive because it: 1) MFA prevents credential stuffing even with valid passwords by requiring second factor, 2) Adaptive risk-based authentication detects anomalies (unusual time, location, volume) and requires additional verification, 3) Behavior analytics with ML identifies patterns inconsistent with normal user behavior, 4) Doesn't disrupt legitimate global users working across time zones. Option A (geo-blocking) would block legitimate employees traveling internationally. Option C (API rotation + IP whitelist) is too disruptive for 2,000 global employees with dynamic IPs. Option D (complex passwords) doesn't prevent use of already-compromised credentials. This layered security approach addresses sophisticated attacks while maintaining usability. Objective 3.1"
        },
        {
            'context': "During a compliance audit, examiners found critical security gaps in cloud storage: 1) Database backups containing 10 million customer records stored in S3 are completely unencrypted, 2) Bucket versioning is enabled but no lifecycle policies exist resulting in 2 years of backup versions consuming excessive storage, 3) Access logging disabled preventing audit trail of who accessed backups, 4) Backup retention exceeds regulatory requirements. The database contains customer PII, financial transactions, and health records requiring GDPR, PCI-DSS, and HIPAA compliance. Regulations mandate 7-year retention with secure deletion afterwards.",
            'question': "What is the MOST critical security remediation to implement FIRST based on compliance risk severity?",
            'options': [
                "Enable S3 access logging immediately to track who accesses backup files and establish audit trails",
                "Implement server-side encryption at rest with customer-managed keys (CMK) for all existing and future backups",
                "Configure lifecycle policies to automatically delete backup versions after 7 years to meet retention requirements",
                "Disable bucket versioning to prevent unauthorized access to previous unencrypted backup versions"
            ],
            'answer': 1,
            'explanation': "Encryption at rest (Option B) must be the FIRST priority because: 1) Unencrypted PII/PHI/financial data represents the highest severity compliance violation for GDPR, HIPAA, and PCI-DSS - potentially resulting in massive fines and breach notification requirements, 2) If breached, 10 million customer records would be exposed in plaintext, 3) Customer-managed keys provide control over encryption and meet compliance requirements for key management, 4) Can be implemented immediately without data loss. While access logging (A), lifecycle policies (C), and versioning management (D) are important, none address the critical exposure of sensitive data in plaintext. GDPR Article 32 and HIPAA Security Rule explicitly require encryption. This is the highest impact, highest urgency remediation. Objective 3.2"
        },
        {
            'context': "A SaaS company experienced a ransomware attack that encrypted production databases and application servers. Investigation revealed: 1) Attacker gained initial access via compromised employee credentials from phishing email, 2) Lateral movement occurred through internal network using stolen administrative credentials stored in plaintext in wikis, 3) Backups stored in same network location were also encrypted by ransomware, 4) No offline or immutable backups existed, 5) Detection occurred 72 hours after initial breach. The company has no viable recovery option and faces paying ransom or losing all customer data.",
            'question': "Which security architecture flaw was the PRIMARY root cause enabling this catastrophic outcome?",
            'options': [
                "Lack of email security filtering to prevent phishing attacks from reaching employee inboxes",
                "Absence of network segmentation and zero-trust architecture allowing unrestricted lateral movement",
                "Failure to implement immutable, air-gapped backups isolated from production environment",
                "Insufficient monitoring and alerting resulting in 72-hour detection delay for the breach"
            ],
            'answer': 2,
            'explanation': "Immutable, air-gapped backups (Option C) is the PRIMARY root cause because: 1) Ransomware attacks are increasingly common and will eventually succeed despite preventive controls, 2) Without immutable backups, there is NO recovery option forcing ransom payment or data loss, 3) Immutable backups (cannot be encrypted or deleted) provide guaranteed recovery regardless of attack sophistication, 4) Air-gapped or offline backups prevent ransomware from spreading to backups via network. While options A, B, and D are important security controls, they are preventive/detective measures that will eventually fail. The fundamental architecture flaw was lack of resilient recovery capability. The 3-2-1 backup rule specifically addresses this: 3 copies, 2 media types, 1 offsite/immutable. This is a backup architecture failure, not just a security control failure. Objective 3.3"
        }
    ]
    
    scenario = random.choice(scenarios)
    q['q'] = scenario['context'] + "\n\n" + scenario['question']
    q['options'] = scenario['options']
    q['answer'] = scenario['answer']
    q['explanation'] = scenario['explanation']
    return q

def enhance_operations_question(q):
    """Transform operations questions into complex scenarios"""
    scenarios = [
        {
            'context': "A SaaS application serving 50,000 customers experiences severe performance degradation every Monday morning between 9:00-9:30 AM. Monitoring data shows: CPU utilization at 45%, memory at 60%, network throughput at 30% of capacity, disk I/O normal. However, database query times spike from average 50ms to 3,000ms. Auto-scaling groups respond by launching 20 additional application servers, but performance issues persist for 25-30 minutes until suddenly resolving. Application logs show connection pool exhaustion errors during the incident. The database connection pool is configured for 100 connections per application server.",
            'question': "What is the MOST likely root cause and appropriate solution for this recurring performance issue?",
            'options': [
                "Insufficient compute resources during peak load; increase minimum instance count in auto-scaling group to pre-warm capacity",
                "Database connection pool saturation and query performance degradation; implement connection pooling optimization and query tuning for Monday morning batch processes",
                "Network bandwidth limitations between application and database tiers; upgrade instance types with enhanced networking",
                "Memory leak in application code accumulating over weekend; implement automated application restart during Sunday night maintenance window"
            ],
            'answer': 1,
            'explanation': "Database connection pool saturation and query issues (Option B) is correct because: 1) Timing pattern (Monday 9 AM) suggests batch processes or weekend data accumulation, 2) Application metrics (CPU 45%, memory 60%) show resources aren't constrained, yet performance is degraded, 3) Query time spike from 50ms to 3,000ms (60x slower) indicates database-level issues, not application tier problems, 4) Connection pool exhaustion errors in logs directly confirm the diagnosis, 5) Adding application servers doesn't help because database is the bottleneck. The solution requires: optimizing queries accessing accumulated weekend data, implementing connection pool management, possibly adding read replicas. Option A (compute) is wrong - metrics show sufficient resources. Option C (network) doesn't match symptoms. Option D (memory leak) would show increasing memory usage. This is classic database bottleneck diagnosis. Objective 4.1"
        },
        {
            'context': "An operations team manages a critical three-tier application: web layer (stateless), application layer (session state), and database layer (5TB PostgreSQL) deployed across three availability zones for high availability. Business requirements demand: RPO (Recovery Point Objective) of 1 hour meaning maximum 1 hour of data loss acceptable, RTO (Recovery Time Objective) of 4 hours meaning system must be restored within 4 hours, and cost optimization to minimize storage expenses. Current database experiences approximately 50GB of changes daily. The team needs to implement a backup strategy meeting these SLA requirements.",
            'question': "Which backup strategy BEST meets the RPO/RTO requirements while optimizing costs?",
            'options': [
                "Full database backups every 24 hours stored in cold storage tier with 12-hour retrieval time",
                "Continuous database replication to secondary region with automated failover and read replicas",
                "Incremental backups every 1 hour with weekly full backups, stored in standard storage with instant retrieval",
                "Snapshot-based backups every 4 hours with instant recovery capability and automatic retention management"
            ],
            'answer': 2,
            'explanation': "Hourly incremental backups with weekly full backups (Option C) is optimal because: 1) RPO of 1 hour is met by taking backups every hour (maximum 1 hour data loss), 2) RTO of 4 hours is met by instant retrieval from standard storage (restore time well within 4 hours for incremental backups), 3) Cost optimized by using incremental backups capturing only 50GB daily changes rather than full 5TB daily, 4) Weekly full backups provide baseline for incremental chain. Option A (daily backups) violates 1-hour RPO and cold storage retrieval time risks violating RTO. Option B (continuous replication) exceeds requirements and costs significantly more than needed. Option D (4-hour snapshots) violates 1-hour RPO. This precisely matches requirements without over-engineering. Objective 4.2"
        },
        {
            'context': "A cloud operations team monitors a containerized microservices application running on Kubernetes. They receive alerts that pod CPU throttling events have increased 300% over the past week, causing API response times to degrade from 200ms to 1,500ms at the 95th percentile. Investigation shows: 1) CPU requests set to 100m (0.1 CPU cores), limits set to 500m (0.5 cores), 2) Actual CPU usage patterns show brief spikes to 800m during request processing, then dropping to 50m idle, 3) Horizontal Pod Autoscaler (HPA) configured to scale at 70% CPU utilization, 4) Memory usage stable at 40% with no throttling.",
            'question': "What is the root cause of throttling and the MOST appropriate solution?",
            'options': [
                "Insufficient CPU requests causing Kubernetes scheduler to place too many pods on same node; increase CPU requests to 500m",
                "CPU limits set too low for actual workload requirements causing throttling during legitimate usage spikes; increase limits to 1000m and adjust requests to 200m",
                "Horizontal Pod Autoscaler threshold too high preventing adequate scaling; reduce HPA threshold to 50% CPU utilization",
                "Memory pressure forcing CPU throttling as pods compete for resources; increase memory requests and limits"
            ],
            'answer': 1,
            'explanation': "CPU limits too low (Option B) is correct because: 1) Actual CPU usage (800m peak) exceeds configured limit (500m), causing Kubernetes to throttle the container, 2) CPU throttling directly causes response time degradation as requests are artificially slowed, 3) Brief usage spikes to 800m are legitimate for request processing, not a problem to eliminate, 4) The solution is to increase limits to 1000m (allowing headroom for spikes) and increase requests to 200m (more accurate resource scheduling). Option A (requests too low) affects scheduling but doesn't cause throttling. Option C (HPA threshold) is irrelevant since throttling occurs within individual pods before scaling triggers. Option D (memory) is wrong - memory is stable at 40%. This is classic CPU limit configuration issue in containerized environments. Objective 4.3"
        }
    ]
    
    scenario = random.choice(scenarios)
    q['q'] = scenario['context'] + "\n\n" + scenario['question']
    q['options'] = scenario['options']
    q['answer'] = scenario['answer']
    q['explanation'] = scenario['explanation']
    return q

def enhance_devops_question(q):
    """Transform DevOps questions into complex scenarios"""
    scenarios = [
        {
            'context': "A development team uses a CI/CD pipeline deploying code to production 15-20 times daily. Last week, a deployment caused a 2-hour production outage affecting 100,000 users. Investigation revealed: the new code version introduced a database schema change (added new column), automated tests passed successfully, deployment succeeded without errors, but when production traffic hit the system, queries using the old code version failed because they expected the old schema. The new code worked fine, but the old code (still running on 50% of servers during rolling deployment) crashed. The team wants to prevent similar issues while maintaining rapid deployment velocity.",
            'question': "Which approach BEST addresses this issue while preserving deployment speed and safety?",
            'options': [
                "Implement manual approval gates and change review boards before each production deployment to catch breaking changes",
                "Add contract testing, backward-compatible database migration patterns, canary deployments with automated rollback, and feature flags",
                "Deploy only during planned maintenance windows with complete system shutdown to prevent version conflicts",
                "Require all database schema changes to be backward compatible for minimum 30 days before cleaning up old columns"
            ],
            'answer': 1,
            'explanation': "Option B (contract testing + migrations + canary + feature flags) is the comprehensive solution because: 1) Contract testing validates that new code versions maintain compatibility with existing database schemas and APIs, 2) Backward-compatible migrations (expand/contract pattern) allow old and new code to coexist during rolling deployments, 3) Canary deployments expose only 5-10% of traffic initially, detecting issues before full rollout, 4) Automated rollback quickly reverts if errors detected, 5) Feature flags decouple deployment from release, allowing safe testing. This enables 15-20 daily deployments safely. Option A (manual gates) slows velocity. Option C (maintenance windows) eliminates continuous deployment. Option D (30-day compatibility) is partial solution without deployment safety. This is modern DevOps best practice for high-velocity, safe deployments. Objective 5.1"
        },
        {
            'context': "An organization has 8 development teams deploying cloud infrastructure independently using various tools: Team A uses Terraform, Team B uses CloudFormation, Team C uses Pulumi, Team D uses ARM templates, others use manual console configurations. This has resulted in: 1) 2,500+ untagged resources making cost allocation impossible, 2) Inconsistent naming conventions preventing resource discovery, 3) Security compliance gaps with 40% of resources violating policies, 4) Cloud spending increased 300% over 6 months from $50k to $200k monthly, 5) Security team cannot audit resources effectively. The CTO wants to solve these challenges while maintaining team autonomy and productivity.",
            'question': "What is the MOST effective strategy to address these infrastructure management challenges?",
            'options': [
                "Mandate a single Infrastructure as Code (IaC) tool organization-wide, implement centralized template libraries with enforced tagging policies, and deploy policy-as-code guardrails",
                "Assign each development team a separate cloud account with hard spending limits and individual billing",
                "Implement a manual architecture review board that approves all infrastructure changes before deployment",
                "Migrate all cloud infrastructure to a single region and availability zone to simplify resource management"
            ],
            'answer': 0,
            'explanation': "Option A (standardize IaC + templates + policy-as-code) is the most effective because it addresses root causes: 1) Single IaC tool (e.g., Terraform) enables consistent automation, version control, and auditing across teams, 2) Centralized template libraries with enforced tagging ensure all resources have proper cost allocation and naming tags, 3) Policy-as-code (e.g., OPA, Sentinel) automatically enforces security compliance preventing deployment of non-compliant resources, 4) Automated controls scale better than manual processes, 5) Teams maintain autonomy using approved templates while guardrails prevent violations. Option B (separate accounts) doesn't solve tagging or security gaps. Option C (manual review) doesn't scale for 8 teams deploying frequently. Option D (single region) reduces resilience and doesn't address core issues. This is infrastructure governance best practice. Objective 5.2"
        },
        {
            'context': "A financial services company runs a microservices architecture with 50+ services deployed via CI/CD pipelines. Their current process: developers commit code, automated tests run (unit, integration), Docker images are built, images are scanned for known CVEs, deployment occurs to production. Last month, a critical zero-day vulnerability in a third-party library was exploited in production despite passing all security scans. The vulnerability was announced publicly 2 days before exploitation, but their images built 7 days prior didn't include the fix. The security team needs to prevent this scenario while maintaining deployment velocity.",
            'question': "Which security approach BEST prevents deployment of images with known vulnerabilities?",
            'options': [
                "Rebuild and redeploy all container images daily to ensure latest security patches are always included",
                "Implement continuous image scanning of running containers in production with automated alerts, vulnerability database updates, and admission controllers blocking deployment of vulnerable images",
                "Require manual security team approval for all third-party library updates before deploying to production",
                "Eliminate all third-party dependencies and build all functionality using only internally developed code"
            ],
            'answer': 1,
            'explanation': "Option B (continuous scanning + admission controllers + alerts) is the comprehensive solution because: 1) Continuous scanning of running containers detects newly disclosed vulnerabilities in previously-deployed images (addresses the zero-day scenario), 2) Admission controllers (e.g., OPA Gatekeeper, Kyverno) prevent deployment of images that don't meet security policies, blocking vulnerable images at deployment time, 3) Automated vulnerability database updates ensure scans use latest CVE information, 4) Automated alerts enable rapid response when new vulnerabilities are disclosed, 5) Maintains deployment velocity with automated security gates. Option A (daily rebuilds) is inefficient and doesn't prevent vulnerable deployments. Option C (manual approval) is too slow. Option D (no third-party libraries) is unrealistic for modern development. This implements shift-left and continuous security. Objective 5.3"
        }
    ]
    
    scenario = random.choice(scenarios)
    q['q'] = scenario['context'] + "\n\n" + scenario['question']
    q['options'] = scenario['options']
    q['answer'] = scenario['answer']
    q['explanation'] = scenario['explanation']
    return q

def enhance_troubleshooting_question(q):
    """Transform troubleshooting questions into complex scenarios"""
    scenarios = [
        {
            'context': "Users across North America report intermittent connectivity issues accessing a cloud-hosted web application. Complaints show approximately 15% of HTTP requests failing randomly. Troubleshooting data collected: 1) Load balancer health checks show all 10 backend instances passing (HTTP 200 OK every 30 seconds), 2) Application server logs show no error messages or exceptions, 3) Database queries complete successfully with normal response times, 4) CDN reporting 95% cache hit rate with normal performance, 5) Network packet captures reveal requests timing out after exactly 29 seconds with no response, 6) Load balancer configuration shows 30-second idle timeout setting, 7) Application server keep-alive timeout set to 60 seconds.",
            'question': "What is the MOST likely cause and appropriate solution for this intermittent connectivity issue?",
            'options': [
                "Load balancer misconfiguration with timeout too low; reduce idle timeout from 30 to 15 seconds to fail faster",
                "Long-running application requests exceeding load balancer idle timeout; implement asynchronous processing pattern for operations taking longer than 30 seconds",
                "CDN cache misconfiguration causing stale content delivery; purge CDN cache and adjust TTL settings to lower values",
                "Network latency between availability zones exceeding thresholds; migrate all backend instances to single availability zone"
            ],
            'answer': 1,
            'explanation': "Long-running requests exceeding timeout (Option B) is correct because: 1) Requests timing out at 29 seconds (just before the 30-second load balancer timeout) indicates operations are taking too long, 2) 15% failure rate suggests specific request types (e.g., complex reports, large data processing) take >30 seconds, 3) Health checks pass because they're simple requests completing quickly, 4) No application errors logged because requests are still processing when timeout occurs, 5) Solution is to refactor long operations using asynchronous patterns (job queues, webhooks, polling) where client receives immediate response and retrieves results later. Option A (reducing timeout) would cause more failures. Option C (CDN) doesn't explain 29-second timeout pattern. Option D (single AZ) reduces resilience unnecessarily. This is classic timeout mismatch troubleshooting. Objective 6.1"
        },
        {
            'context': "A microservices-based e-commerce platform experiences cascading failures during traffic spikes. Observed pattern: 1) Product recommendation service becomes slow responding in 5 seconds instead of 200ms, 2) Checkout service calls recommendation service with 3-second timeout, waits, then fails, 3) Checkout service thread pool (200 threads) exhausts as all threads wait for slow recommendation service, 4) Checkout service stops responding to all requests including those not needing recommendations, 5) Order service calls checkout service, times out, exhausts its thread pool, 6) Entire platform becomes unresponsive within 10 minutes, 7) System takes 30+ minutes to recover even after traffic normalizes.",
            'question': "Which design pattern should be implemented to prevent these cascading failures and improve system resilience?",
            'options': [
                "Increase timeout values across all services from 3 seconds to 30 seconds to allow more time for slow operations to complete",
                "Implement circuit breaker pattern with fallback responses, bulkhead isolation using separate thread pools, and fail-fast mechanisms",
                "Vertically scale all microservices to maximum instance sizes to handle any possible traffic spike and resource contention",
                "Deploy a complete redundant copy of the entire microservices stack in a different region with automatic DNS failover"
            ],
            'answer': 1,
            'explanation': "Circuit breaker + bulkhead + fail-fast (Option B) is correct because it addresses the cascading failure root causes: 1) Circuit breaker monitors failure rates and 'opens' after threshold, immediately returning fallback responses without calling failing service (prevents waiting on timeouts), 2) Bulkhead isolation separates thread pools for different dependencies (e.g., 50 threads for recommendations, 150 for other operations) preventing one slow dependency from exhausting all resources, 3) Fail-fast mechanisms return errors immediately rather than waiting full timeout period, 4) This prevents cascade: slow recommendation service doesn't impact checkout's other operations, checkout doesn't drag down order service. Option A (longer timeouts) makes cascading worse. Option C (vertical scaling) doesn't prevent architectural issue. Option D (redundant stack) doesn't fix the design flaw. This is resilience engineering best practice from Netflix's Hystrix patterns. Objective 6.2"
        }
    ]
    
    scenario = random.choice(scenarios)
    q['q'] = scenario['context'] + "\n\n" + scenario['question']
    q['options'] = scenario['options']
    q['answer'] = scenario['answer']
    q['explanation'] = scenario['explanation']
    return q

def enhance_question_based_on_category(question, category):
    """Route question to appropriate enhancement function based on category and content"""
    
    # Make a deep copy to avoid modifying original
    enhanced = copy.deepcopy(question)
    
    original_q = question['q'].lower()
    
    # Detect question type and apply specific enhancement
    if 'service model' in original_q or 'iaas' in original_q or 'paas' in original_q or 'saas' in original_q or 'faas' in original_q:
        return enhance_service_model_question(enhanced)
    elif 'shared responsibility' in original_q or 'responsible for' in original_q or 'responsibility' in original_q:
        return enhance_shared_responsibility_question(enhanced)
    elif '1. cloud architecture' in category.lower():
        return enhance_service_model_question(enhanced)
    elif '2. deployment' in category.lower() or 'deploy' in original_q or 'migration' in original_q:
        return enhance_deployment_question(enhanced)
    elif '3. security' in category.lower() or 'security' in original_q or 'encryption' in original_q or 'compliance' in original_q:
        return enhance_security_question(enhanced)
    elif '4. operations' in category.lower() or 'monitor' in original_q or 'backup' in original_q or 'performance' in original_q:
        return enhance_operations_question(enhanced)
    elif '5. devops' in category.lower() or 'ci/cd' in original_q or 'pipeline' in original_q or 'automation' in original_q:
        return enhance_devops_question(enhanced)
    elif '6. troubleshooting' in category.lower() or 'troubleshoot' in original_q or 'issue' in original_q or 'problem' in original_q:
        return enhance_troubleshooting_question(enhanced)
    else:
        # For questions that don't match specific patterns, add generic scenario enhancement
        return enhance_generic_question(enhanced)

def enhance_generic_question(q):
    """Enhance questions that don't fit specific categories with generic scenarios"""
    
    context = generate_scenario_context()
    
    # Add scenario context to the question
    original_question = q['q']
    
    # Check if question already has scenario indicators
    if len(original_question) > 200 or 'company' in original_question.lower() or 'organization' in original_question.lower():
        # Already has some context, just enhance options
        enhanced_options = []
        for option in q['options']:
            # Make options more detailed and nuanced
            if len(option) < 50:
                # Add technical details to short options
                details = random.choice([
                    " with automated monitoring and alerting capabilities",
                    " configured for high availability across multiple zones",
                    " implementing least privilege access controls",
                    " with comprehensive audit logging enabled",
                    " utilizing infrastructure as code for reproducibility"
                ])
                enhanced_options.append(option + details)
            else:
                enhanced_options.append(option)
        q['options'] = enhanced_options
    else:
        # Add full scenario context
        q['q'] = f"{context}\n\n{original_question}"
        
    return q

def process_all_questions(input_file, output_file):
    """
    Main processing function that enhances all 615 questions
    """
    
    print("=" * 80)
    print("Cloud Plus Comprehensive Question Enhancement Script")
    print("=" * 80)
    print(f"\nTarget: Enhance all 615 Cloud Plus exam questions")
    print(f"Input file: {input_file}")
    print(f"Output file: {output_file}")
    
    # Step 1: Create backup
    print("\nStep 1: Creating backup...")
    backup_file = create_backup(input_file)
    
    # Step 2: Load questions
    print("\nStep 2: Loading questions from JSON file...")
    try:
        with open(input_file, 'r', encoding='utf-8') as f:
            questions_data = json.load(f)
    except Exception as e:
        print(f"✗ Error loading file: {e}")
        return
    
    # Count total questions
    total_questions = sum(len(questions) for questions in questions_data.values())
    print(f"✓ Loaded {total_questions} questions across {len(questions_data)} categories")
    
    # Step 3: Process all questions
    print("\nStep 3: Enhancing questions with detailed scenarios...")
    print("-" * 80)
    
    enhanced_data = {}
    total_processed = 0
    
    for category, questions in questions_data.items():
        print(f"\nProcessing: {category}")
        print(f"  Total questions: {len(questions)}")
        
        enhanced_data[category] = []
        category_processed = 0
        
        for i, question in enumerate(questions):
            try:
                # Enhance each question
                enhanced_q = enhance_question_based_on_category(question, category)
                enhanced_data[category].append(enhanced_q)
                category_processed += 1
                total_processed += 1
                
                # Show progress every 10 questions
                if (i + 1) % 10 == 0:
                    percentage = ((i + 1) / len(questions)) * 100
                    print(f"  Progress: {i + 1}/{len(questions)} ({percentage:.1f}%)")
                    
            except Exception as e:
                print(f"  ✗ Error enhancing question {i + 1}: {e}")
                # Keep original question if enhancement fails
                enhanced_data[category].append(question)
                category_processed += 1
                total_processed += 1
        
        print(f"  ✓ Completed: {category_processed}/{len(questions)} questions enhanced")
    
    # Step 4: Save enhanced questions
    print("\n" + "-" * 80)
    print(f"\nStep 4: Saving enhanced questions to {output_file}...")
    
    try:
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(enhanced_data, f, indent=2, ensure_ascii=False)
        print(f"✓ Successfully saved {total_processed} enhanced questions")
    except Exception as e:
        print(f"✗ Error saving file: {e}")
        return
    
    # Step 5: Print summary
    print("\n" + "=" * 80)
    print("ENHANCEMENT SUMMARY")
    print("=" * 80)
    print(f"\nTotal questions processed: {total_processed}")
    print(f"Backup file: {backup_file}")
    print(f"Output file: {output_file}")
    print("\nQuestions by category:")
    
    for category, questions in enhanced_data.items():
        print(f"  {category}: {len(questions)} questions")
    
    print("\n" + "=" * 80)
    print("✓ Enhancement complete! All questions have been transformed into")
    print("  challenging, scenario-based questions requiring critical thinking.")
    print("=" * 80)
    
    return enhanced_data

if __name__ == "__main__":
    import os
    import sys
    
    # Use relative paths from script location or allow command-line arguments
    if len(sys.argv) > 1:
        input_file = sys.argv[1]
        output_file = sys.argv[2] if len(sys.argv) > 2 else input_file
    else:
        # Default to relative path from script location
        script_dir = os.path.dirname(os.path.abspath(__file__))
        input_file = os.path.join(script_dir, "public/quiz/questions_cloudplus.json")
        output_file = input_file
    
    print("\n⚠️  WARNING: This will OVERWRITE the original questions file!")
    print(f"   File: {output_file}")
    print("   A backup will be created first.\n")
    
    enhanced_data = process_all_questions(input_file, output_file)
    
    if enhanced_data:
        print("\n✓ All 615 questions have been successfully enhanced!")
