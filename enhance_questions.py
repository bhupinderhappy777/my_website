#!/usr/bin/env python3
"""
Script to enhance Cloud Plus exam questions to make them more challenging,
scenario-based, and require critical thinking.

This script transforms simple, straightforward questions into complex, scenario-based
questions that require critical thinking and deep understanding of Cloud+ objectives.
"""

import json
import random
import copy
import re

def enhance_question(question, category):
    """
    Enhance a question to make it more challenging and scenario-based.
    This includes:
    - Adding realistic scenarios
    - Making options less straightforward
    - Requiring critical thinking
    - Adding complexity similar to CompTIA exams
    """
    
    # Create a deep copy to avoid modifying original
    enhanced = copy.deepcopy(question)
    
    original_q = question['q']
    original_options = question['options']
    correct_answer = question['answer']
    
    # Enhancement strategies based on question content
    enhancements = []
    
    # Strategy 1: Add scenario-based context
    if 'company' in original_q.lower() or 'organization' in original_q.lower():
        # Already has some scenario, enhance it
        scenarios = [
            "A rapidly growing startup with 500 employees across three continents",
            "A financial services company subject to PCI-DSS compliance requirements",
            "A healthcare provider managing HIPAA-compliant patient data",
            "A manufacturing company operating in a hybrid cloud environment",
            "A retail organization experiencing seasonal traffic spikes of 300%",
            "A government agency with strict data sovereignty requirements",
            "An e-commerce platform processing 10,000 transactions per minute during peak hours"
        ]
        enhancements.append('add_detailed_scenario')
    else:
        # Add scenario from scratch
        enhancements.append('create_scenario')
    
    # Strategy 2: Make options more nuanced
    enhancements.append('nuanced_options')
    
    # Strategy 3: Add constraints and requirements
    enhancements.append('add_constraints')
    
    # Apply enhancements based on category and question type
    if '1. cloud architecture' in category.lower():
        enhanced = enhance_architecture_question(enhanced, original_q, original_options, correct_answer)
    elif '2. deployment' in category.lower():
        enhanced = enhance_deployment_question(enhanced, original_q, original_options, correct_answer)
    elif '3. security' in category.lower():
        enhanced = enhance_security_question(enhanced, original_q, original_options, correct_answer)
    elif '4. operations' in category.lower():
        enhanced = enhance_operations_question(enhanced, original_q, original_options, correct_answer)
    elif '5. devops' in category.lower():
        enhanced = enhance_devops_question(enhanced, original_q, original_options, correct_answer)
    elif '6. troubleshooting' in category.lower():
        enhanced = enhance_troubleshooting_question(enhanced, original_q, original_options, correct_answer)
    
    return enhanced

def enhance_architecture_question(q, original_q, original_options, correct_answer):
    """Enhance Cloud Architecture questions"""
    
    # Detect question type
    if 'service model' in original_q.lower():
        # Service model questions - make more scenario-based
        scenarios = [
            {
                'context': 'A development team needs to deploy microservices-based applications rapidly without managing Kubernetes clusters, load balancers, or underlying VMs. The team wants to focus solely on containerized application code while ensuring automatic scaling during traffic spikes. Cost optimization is critical, and they prefer consumption-based pricing.',
                'options_template': {
                    0: 'Deploy on IaaS with self-managed Kubernetes clusters and implement custom autoscaling',
                    1: 'Use a managed container platform (PaaS) with built-in orchestration and autoscaling',
                    2: 'Implement a SaaS-based container management solution with third-party tools',
                    3: 'Deploy serverless containers (FaaS/CaaS) with event-driven scaling'
                },
                'answer': 1
            },
            {
                'context': 'An enterprise requires complete control over security configurations, custom kernel modules, and specialized networking equipment. They need to run proprietary software that requires specific OS versions and hardware specifications. The IT team has deep Linux expertise and wants full administrative access.',
                'options_template': {
                    0: 'Implement Infrastructure as a Service (IaaS) with dedicated virtual machines',
                    1: 'Use Platform as a Service (PaaS) with custom buildpacks',
                    2: 'Deploy on Software as a Service (SaaS) with API integrations',
                    3: 'Leverage Function as a Service (FaaS) with custom runtimes'
                },
                'answer': 0
            }
        ]
        
        # Pick a random scenario
        scenario = random.choice(scenarios)
        q['q'] = scenario['context'] + '\n\nWhich cloud service model BEST meets these requirements?'
        q['options'] = [scenario['options_template'][i] for i in range(4)]
        q['answer'] = scenario['answer']
        
        # Enhance explanation
        q['explanation'] = enhance_explanation(q['explanation'], scenario['context'])
        
    elif 'shared responsibility' in original_q.lower() or 'responsible for' in original_q.lower():
        # Shared responsibility questions
        scenarios = [
            {
                'context': 'A healthcare organization has deployed a patient management system on Amazon EC2 instances within a VPC. During a security audit, the compliance team discovered that patient health records (PHI) were transmitted without encryption between the application servers and the database. The CISO wants to determine accountability for this security gap.',
                'question': 'According to the cloud shared responsibility model, who is primarily responsible for ensuring data encryption in transit for this IaaS deployment?',
                'options': [
                    'The cloud provider is responsible for all encryption, including data in transit between customer resources',
                    'The customer is responsible for implementing and managing encryption for data in transit between their resources',
                    'Shared responsibility: provider encrypts the network, customer encrypts the data',
                    'The responsibility is determined by the specific SLA negotiated with the cloud provider'
                ],
                'answer': 1
            },
            {
                'context': 'A SaaS-based CRM platform experienced a security breach where unauthorized users accessed customer contact information. The company using the CRM claims the SaaS vendor is fully responsible for security. The vendor argues that the customer failed to implement proper user access controls and MFA enforcement.',
                'question': 'In this SaaS environment, how should security responsibility be allocated for user access management?',
                'options': [
                    'The SaaS provider is fully responsible for all security including user access and authentication',
                    'The customer is responsible for managing user identities, access permissions, and authentication policies',
                    'Security responsibility is equally shared with both parties managing identical security controls',
                    'The responsibility depends entirely on customization level of the SaaS application'
                ],
                'answer': 1
            }
        ]
        
        scenario = random.choice(scenarios)
        q['q'] = scenario['context'] + '\n\n' + scenario['question']
        q['options'] = scenario['options']
        q['answer'] = scenario['answer']
        q['explanation'] = enhance_explanation(q['explanation'], scenario['context'])
    
    return q

def enhance_deployment_question(q, original_q, original_options, correct_answer):
    """Enhance Deployment questions"""
    
    # Add complex deployment scenarios
    if 'deploy' in original_q.lower() or 'deployment' in original_q.lower():
        scenarios = [
            {
                'context': 'A global e-commerce company needs to deploy a new payment processing service across multiple regions. The service must have sub-50ms response times for users worldwide, support active-active configuration for disaster recovery, and handle PCI-DSS compliance requirements. The deployment must minimize data transfer costs between regions while maintaining data residency compliance in the EU and Asia-Pacific.',
                'question': 'Which deployment strategy BEST addresses these requirements?',
                'options': [
                    'Deploy a single region with global CDN for static content and edge caching for dynamic content',
                    'Implement multi-region active-active deployment with regional data stores and cross-region replication',
                    'Use a primary region with warm standby in secondary regions and DNS-based failover',
                    'Deploy containerized services with global load balancing and centralized database cluster'
                ],
                'answer': 1
            },
            {
                'context': 'A software company is migrating a monolithic on-premises application to the cloud. The application has tightly coupled components, a shared SQL database, and batch processing jobs that run during off-peak hours. The business requires zero downtime during migration and wants to gradually move functionality to the cloud over six months while maintaining full operational capability.',
                'question': 'What migration strategy should the company employ?',
                'options': [
                    'Lift-and-shift the entire application to IaaS VMs in one migration window',
                    'Re-architect to microservices before any cloud migration begins',
                    'Implement the strangler fig pattern with incremental feature migration and API gateway',
                    'Replicate the on-premises environment in the cloud and use blue-green deployment for cutover'
                ],
                'answer': 2
            }
        ]
        
        scenario = random.choice(scenarios)
        q['q'] = scenario['context'] + '\n\n' + scenario['question']
        q['options'] = scenario['options']
        q['answer'] = scenario['answer']
        q['explanation'] = enhance_explanation(q['explanation'], scenario['context'])
    
    return q

def enhance_security_question(q, original_q, original_options, correct_answer):
    """Enhance Security questions"""
    
    scenarios = [
        {
            'context': 'A financial institution has detected unusual API activity during off-hours: multiple failed authentication attempts from various IP addresses in different countries, followed by successful logins using valid credentials. The security team suspects credential harvesting and wants to implement preventive measures without disrupting legitimate global operations.',
            'question': 'Which security controls should be prioritized to address this threat? (Choose the MOST comprehensive approach)',
            'options': [
                'Implement geo-blocking for all countries except headquarters location',
                'Enable multi-factor authentication, implement adaptive risk-based authentication, and deploy behavior analytics',
                'Rotate all API keys immediately and enforce IP whitelisting for all API endpoints',
                'Increase password complexity requirements and enforce 30-day password rotation'
            ],
            'answer': 1
        },
        {
            'context': 'During a security assessment, auditors found that database backups stored in cloud object storage are unencrypted, versioning is enabled without lifecycle policies, and access logging is disabled. The database contains customer PII and financial transactions. Compliance requires data retention for 7 years but secure deletion afterwards.',
            'question': 'What is the MOST critical security remediation to implement first?',
            'options': [
                'Enable access logging to track who accesses backup files',
                'Implement server-side encryption at rest with customer-managed keys for all backups',
                'Configure lifecycle policies to delete backups after 7 years',
                'Disable versioning to prevent unauthorized access to previous versions'
            ],
            'answer': 1
        }
    ]
    
    scenario = random.choice(scenarios)
    q['q'] = scenario['context'] + '\n\n' + scenario['question']
    q['options'] = scenario['options']
    q['answer'] = scenario['answer']
    q['explanation'] = enhance_explanation(q['explanation'], scenario['context'])
    
    return q

def enhance_operations_question(q, original_q, original_options, correct_answer):
    """Enhance Operations questions"""
    
    scenarios = [
        {
            'context': 'A SaaS application running on auto-scaling infrastructure experiences periodic performance degradation every Monday morning at 9 AM. Monitoring shows CPU utilization at 45%, memory at 60%, and network throughput within normal ranges. Application logs indicate database query times spike from 50ms to 3000ms during these periods. The auto-scaling group scales up instances, but performance issues persist for 20-30 minutes.',
            'question': 'What is the MOST likely root cause and appropriate solution?',
            'options': [
                'Insufficient compute resources; increase minimum instance count in auto-scaling group',
                'Database connection pool exhaustion; optimize connection management and query performance',
                'Network bandwidth limitations; upgrade to instances with enhanced networking',
                'Memory leak in application code; implement application restart during off-peak hours'
            ],
            'answer': 1
        },
        {
            'context': 'An operations team manages a multi-tier application with web servers, application servers, and database clusters across three availability zones. They need to implement a backup strategy that ensures RPO of 1 hour and RTO of 4 hours while minimizing storage costs. The database size is 5TB with approximately 50GB of changes daily.',
            'question': 'Which backup strategy BEST meets these requirements?',
            'options': [
                'Full backups every 24 hours stored in cold storage',
                'Continuous replication to secondary region with automated failover',
                'Incremental backups every hour with weekly full backups',
                'Snapshot-based backups every 4 hours with instant recovery capability'
            ],
            'answer': 2
        }
    ]
    
    scenario = random.choice(scenarios)
    q['q'] = scenario['context'] + '\n\n' + scenario['question']
    q['options'] = scenario['options']
    q['answer'] = scenario['answer']
    q['explanation'] = enhance_explanation(q['explanation'], scenario['context'])
    
    return q

def enhance_devops_question(q, original_q, original_options, correct_answer):
    """Enhance DevOps Fundamentals questions"""
    
    scenarios = [
        {
            'context': 'A development team uses a CI/CD pipeline that builds, tests, and deploys code to production multiple times daily. Recently, a deployment caused a production outage when new code was incompatible with the existing database schema. The deployment passed all automated tests but failed when real user traffic hit the system. The team wants to prevent similar issues without significantly slowing down the deployment process.',
            'question': 'Which approach BEST addresses this issue while maintaining deployment velocity?',
            'options': [
                'Implement manual approval gates before each production deployment',
                'Add contract testing, database migration validation, and progressive rollout with automated rollback',
                'Deploy only during maintenance windows with full system shutdown',
                'Require all database changes to be backwards compatible for 30 days minimum'
            ],
            'answer': 1
        },
        {
            'context': 'An organization has multiple development teams deploying infrastructure using Infrastructure as Code (IaC). Different teams are using different tools and inconsistent naming conventions, resulting in resource sprawl, difficulty tracking costs, and security compliance gaps. The cloud bill has increased 200% in six months, and the security team cannot effectively audit resources.',
            'question': 'What is the MOST effective strategy to address these challenges?',
            'options': [
                'Mandate a single IaC tool and implement centralized template libraries with enforced tagging policies',
                'Assign each team a separate AWS account with spending limits',
                'Implement a manual review process for all infrastructure changes',
                'Migrate all infrastructure to a single region to simplify management'
            ],
            'answer': 0
        }
    ]
    
    scenario = random.choice(scenarios)
    q['q'] = scenario['context'] + '\n\n' + scenario['question']
    q['options'] = scenario['options']
    q['answer'] = scenario['answer']
    q['explanation'] = enhance_explanation(q['explanation'], scenario['context'])
    
    return q

def enhance_troubleshooting_question(q, original_q, original_options, correct_answer):
    """Enhance Troubleshooting questions"""
    
    scenarios = [
        {
            'context': 'Users report intermittent connectivity issues when accessing a cloud-hosted web application. The issues occur randomly, affecting about 15% of requests. Monitoring shows: load balancer health checks passing, all backend instances healthy, no error logs in application servers, CDN reporting normal cache hit rates. Network packet captures show some requests timing out after 29 seconds. The load balancer has a 30-second idle timeout configured.',
            'question': 'What is the MOST likely cause and solution?',
            'options': [
                'Load balancer misconfiguration; reduce idle timeout to 15 seconds',
                'Long-running application requests exceeding load balancer timeout; implement asynchronous processing for long operations',
                'CDN cache misconfiguration; clear CDN cache and adjust TTL settings',
                'Network latency between availability zones; migrate all resources to single AZ'
            ],
            'answer': 1
        },
        {
            'context': 'A cloud-based microservices application experiences cascading failures during traffic spikes. When one service becomes slow, upstream services time out waiting for responses, their thread pools exhaust, and they stop responding to other requests. This creates a domino effect across the entire system. The system recovers slowly even after traffic returns to normal levels.',
            'question': 'Which design pattern should be implemented to prevent cascading failures?',
            'options': [
                'Increase timeout values across all services to wait longer for responses',
                'Implement circuit breakers with fallback responses and bulkhead isolation',
                'Scale all services to maximum capacity to handle any spike',
                'Deploy a redundant copy of the entire stack in a different region'
            ],
            'answer': 1
        }
    ]
    
    scenario = random.choice(scenarios)
    q['q'] = scenario['context'] + '\n\n' + scenario['question']
    q['options'] = scenario['options']
    q['answer'] = scenario['answer']
    q['explanation'] = enhance_explanation(q['explanation'], scenario['context'])
    
    return q

def enhance_explanation(original_explanation, context):
    """Enhance the explanation with more detail and context"""
    # Keep the objective reference if present
    objective_ref = ""
    if "Objective" in original_explanation:
        parts = original_explanation.split("Objective")
        objective_ref = " Objective" + parts[-1]
    
    enhanced = original_explanation + " In this scenario, " + context[:100] + "..." + objective_ref
    return enhanced

def process_questions_batch(input_file, output_file, batch_size=50):
    """
    Process questions in batches and save to output file.
    """
    
    print(f"Loading questions from {input_file}...")
    with open(input_file, 'r') as f:
        questions_data = json.load(f)
    
    enhanced_data = {}
    total_processed = 0
    
    for category, questions in questions_data.items():
        print(f"\nProcessing category: {category} ({len(questions)} questions)")
        enhanced_data[category] = []
        
        for i, question in enumerate(questions):
            # Enhance the question
            enhanced_q = enhance_question(question, category)
            enhanced_data[category].append(enhanced_q)
            total_processed += 1
            
            if (i + 1) % batch_size == 0:
                print(f"  Processed {i + 1}/{len(questions)} questions...")
        
        print(f"  Completed {category}: {len(enhanced_data[category])} questions enhanced")
    
    print(f"\nTotal questions processed: {total_processed}")
    
    # Save enhanced questions
    print(f"Saving enhanced questions to {output_file}...")
    with open(output_file, 'w') as f:
        json.dump(enhanced_data, f, indent=2)
    
    print("Enhancement complete!")
    
    return enhanced_data

if __name__ == "__main__":
    input_file = "public/quiz/questions_cloudplus.json"
    output_file = "public/quiz/questions_cloudplus_enhanced.json"
    
    enhanced_data = process_questions_batch(input_file, output_file)
    
    # Print summary
    print("\n=== Enhancement Summary ===")
    for category, questions in enhanced_data.items():
        print(f"{category}: {len(questions)} questions")
