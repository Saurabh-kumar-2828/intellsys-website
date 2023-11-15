pipeline {
    agent any

    environment {
        // Name of the ECR repository used to store docker images
        ECR_REPOSITORY_NAME = "intellsys"
        // Name of github repository of this project
        GITHUB_REPOSITORY_NAME = "intellsys-website"
        // Username of docker hub account
        DOCKER_USER = "growthjockey"
        // The AWS region where the servers and ECR repositories are located
        AWS_REGION = "ap-south-1"
        // Account ID of AWS account
        AWS_ACCOUNT_ID = "048578456468"
        // URI OF ECR
        ECR_URI = "${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com"
        // Complete URI of base image of stage environment
        BASE_IMAGE_STAGING = "048578456468.dkr.ecr.ap-south-1.amazonaws.com/base-images:intellsys-stage"
        // Complete URI of base image of prod environment
        BASE_IMAGE_PROD = "048578456468.dkr.ecr.ap-south-1.amazonaws.com/base-images:intellsys-prod"
        // Complete URI of docker image of stage environment
        DOCKER_IMAGE_STAGING = "048578456468.dkr.ecr.ap-south-1.amazonaws.com/intellsys-stage"
        // Complete URI of docker image of prod environment
        DOCKER_IMAGE_PROD = "048578456468.dkr.ecr.ap-south-1.amazonaws.com/intellsys-prod"
        // Path to nginx configuration file
        NGINX_FILE = "/etc/nginx/conf.d/intellsys.conf"
        // Port which has been exposed in Dockerfile
        DOCKER_PORT = "3000"
        // Port on which app is running
        CONTAINER_PORT = "3000"
        // Port used for fallback server
        FALLBACK_PORT = "3001"
        // IP address of staging server
        IP_STAGE = "13.126.188.129"
        // IP address of production server
        IP_PROD = "3.6.162.95"
        // Name of the jenkins pipeline
        JENKINS_JOB = "intellsys-website"
    }

    tools {
        nodejs "node"
    }

    stages {
        stage("Logging into AWS ECR") {
            steps {
                script {
                    if (env.BRANCH_NAME == "prod" || env.BRANCH_NAME == "stage") {
                        sh "sudo aws ecr get-login-password --region ${AWS_REGION} | docker login --username AWS --password-stdin ${ECR_URI}"
                    } else {
                        return
                    }
                }
            }
        }

        stage("Cloning git website") {
            steps {
                script {
                    if (env.BRANCH_NAME == "prod" || env.BRANCH_NAME == "stage") {
                        git branch: env.BRANCH_NAME, credentialsId: "33c357dc-5f11-4930-9063-07bc866f7cff", url: "https://github.com/GrowthJockey/${GITHUB_REPOSITORY_NAME}.git"
                    } else {
                        return
                    }
                }
            }
        }

        stage("Git fetch") {
            steps {
                script {
                    if (env.BRANCH_NAME == "staging") {
                        DIRECTORY = "staging"
                    } else if (env.BRANCH_NAME == "prod") {
                        DIRECTORY = "prod"
                    } else {
                        return
                    }

                    def commitId
                    withCredentials([gitUsernamePassword(credentialsId: "33c357dc-5f11-4930-9063-07bc866f7cff", gitToolName: "Default")]) {
                        commitId = sh(script: """
                            cd /var/lib/jenkins/workspace/${JENKINS_JOB}_${DIRECTORY}
                            git checkout ${env.BRANCH_NAME}
                            git rev-parse ${env.BRANCH_NAME}
                        """, returnStdout: true).trim()

                        sh "sed -i \"s/COMMIT_ID/${commitId}/g\" app/routes/health-check.tsx"
                    }
                }
            }
        }

        stage("Build") {
            steps {
                script {
                    if (env.BRANCH_NAME == "staging") {
                        DIRECTORY = "staging"
                    } else if (env.BRANCH_NAME == "prod") {
                        DIRECTORY = "prod"
                    } else {
                        return
                    }

                    sh "cd /var/lib/jenkins/workspace/${JENKINS_JOB}_${DIRECTORY}"
                    sh "npm ci"
                    sh "npm run build"
                }
            }
        }

        stage("Building image") {
            steps {
                script {
                    if (env.BRANCH_NAME == "staging") {
                        BASE_IMAGE = BASE_IMAGE_STAGING
                    } else if (env.BRANCH_NAME == "prod") {
                        BASE_IMAGE = BASE_IMAGE_PROD
                    } else {
                        return
                    }

                    withCredentials([usernamePassword(credentialsId: "9831574e-4c5c-4476-b75b-0924dfb662dd", passwordVariable: "DOCKER_CREDENTIALS", usernameVariable: "DOCKER_USER")]) {
                        sh "docker login -u growthjockey -p ${DOCKER_CREDENTIALS}"
                        sh "docker build --build-arg BASE_IMAGE=${BASE_IMAGE} -t ${ECR_REPOSITORY_NAME}:latest ."
                    }
                }
            }
        }

        stage("Pushing to ECR") {
            steps {
                script {
                    if (env.BRANCH_NAME == "staging") {
                        ENVIRONMENT = "stage"
                        DOCKER_IMAGE = DOCKER_IMAGE_STAGING
                    } else if (env.BRANCH_NAME == "prod") {
                        ENVIRONMENT = "prod"
                        DOCKER_IMAGE = DOCKER_IMAGE_PROD
                    } else {
                        return
                    }

                    sh "docker tag ${ECR_REPOSITORY_NAME}:latest ${ECR_URI}/${ECR_REPOSITORY_NAME}-${ENVIRONMENT}:${env.BUILD_ID}"
                    sh "docker push ${DOCKER_IMAGE}:${env.BUILD_ID}"
                }
            }
        }

        stage("Removing fallback container") {
            steps {
                script {
                    if (env.BRANCH_NAME == "staging") {
                        ADDRESS = IP_STAGE
                    } else if (env.BRANCH_NAME == "prod") {
                        ADDRESS = IP_PROD
                    } else {
                        return
                    }

                    def dockerCommand = "sudo docker ps -a | grep ${ECR_REPOSITORY_NAME}-fallback | wc -l"
                    def fullSshCommand = "ssh ubuntu@${ADDRESS} '${dockerCommand}'"

                    sshagent(["f74f1a2f-5c3d-49e4-a0e5-646f8d9e87ea"]) {
                        def commandOutput = sh(script: fullSshCommand, returnStdout: true).trim()
                        def count = commandOutput.toInteger()

                        if (count == 1) {
                            sh "ssh ubuntu@${ADDRESS} 'sudo su'"
                            sh "ssh ubuntu@${ADDRESS} 'sudo docker rm -f ${ECR_REPOSITORY_NAME}-fallback'"
                        } else {
                            echo "${ECR_REPOSITORY_NAME}-fallback container not found"
                        }
                    }
                }
            }
        }

        stage("Deploy") {
            steps {
                script {
                    if (env.BRANCH_NAME == "staging") {
                        ADDRESS = IP_STAGE
                        ENVIRONMENT = "stage"
                    } else if (env.BRANCH_NAME == "prod") {
                        ADDRESS = IP_PROD
                        ENVIRONMENT = "prod"
                    } else {
                        return
                    }

                    def dockerCommand = "sudo docker ps -a | grep ${ECR_REPOSITORY_NAME}-container | wc -l"
                    def fullSshCommand = "ssh ubuntu@${ADDRESS} '${dockerCommand}'"

                    sshagent(["f74f1a2f-5c3d-49e4-a0e5-646f8d9e87ea"]) {
                        sh "ssh ubuntu@${ADDRESS} 'sudo docker pull ${ECR_URI}/${ECR_REPOSITORY_NAME}-${ENVIRONMENT}:${env.BUILD_ID}'"
                        sh "ssh ubuntu@${ADDRESS} 'sudo docker run -d -p ${FALLBACK_PORT}:${DOCKER_PORT} --name ${ECR_REPOSITORY_NAME}-fallback ${ECR_URI}/${ECR_REPOSITORY_NAME}-${ENVIRONMENT}:${env.BUILD_ID}'"
                        sh "ssh ubuntu@${ADDRESS} \
                            'while [[ \"\$(curl -vL -s -o /dev/null -w \"%{http_code}\" localhost:${FALLBACK_PORT})\" -ne 200 ]]; do sleep 1; done'"
                        sh "ssh ubuntu@${ADDRESS} 'sudo sed -i s~http://localhost:${CONTAINER_PORT}~http://localhost:${FALLBACK_PORT}~g ${NGINX_FILE}'"
                        sh "ssh ubuntu@${ADDRESS} 'sudo nginx -s reload'"
                        def commandOutput = sh(script: fullSshCommand, returnStdout: true).trim()
                        def count = commandOutput.toInteger()

                        if (count == 1) {
                            sh "ssh ubuntu@${ADDRESS} 'sudo su'"
                            sh "ssh ubuntu@${ADDRESS} 'sudo docker rm -f ${ECR_REPOSITORY_NAME}-container'"
                        }

                        sh "ssh ubuntu@${ADDRESS} 'sudo docker run -d -p ${CONTAINER_PORT}:${DOCKER_PORT} --name ${ECR_REPOSITORY_NAME}-container ${ECR_URI}/${ECR_REPOSITORY_NAME}-${ENVIRONMENT}:${env.BUILD_ID}'"
                        sh "ssh ubuntu@${ADDRESS} \
                            'while [[ \"\$(curl -vL -s -o /dev/null -w \"%{http_code}\" localhost:${CONTAINER_PORT})\" -ne 200 ]]; do sleep 1; done'"
                        sh "ssh ubuntu@${ADDRESS} 'sudo sed -i s~http://localhost:${FALLBACK_PORT}~http://localhost:${CONTAINER_PORT}~g ${NGINX_FILE}'"
                        sh "ssh ubuntu@${ADDRESS} 'sudo nginx -s reload'"
                        sh "ssh ubuntu@${ADDRESS} 'sudo docker rm -f ${ECR_REPOSITORY_NAME}-fallback'"
                    }
                }
            }
        }

        stage('Workspace Cleanup') {
            steps {
                cleanWs()
                //checkout scm
            }
        }
    }
}
