pipeline {
    agent any
    environment {
        REPOSITORY_NAME='intellsys-website'
        DockerUser="growthjockey"
        AWS_ACCOUNT_ID="048578456468"
        AWS_DEFAULT_REGION="ap-south-1"
        REPOSITORY_URI = "048578456468.dkr.ecr.us-east-1.amazonaws.com/env.BRANCH_NAME"
    }

    stages {
        stage('Logging into AWS ECR') {
            steps {
                script {
                    sh "sudo aws ecr get-login-password --region ap-south-1 | docker login --username AWS --password-stdin 048578456468.dkr.ecr.ap-south-1.amazonaws.com"
                }
            }
        }
    

        stage('Cloning Git website') {
            steps {
                //sh 'sudo rm -rf test-23-06-22; mkdir test-23-06-22; cd test-23-06-22; eval "$(ssh-agent -s)"; ssh-add /home/jenkins/sshKeys/bitbuckey-key; git clone git@bitbucket.org:growthjockey-workspace/livguard-website.git; cd livguard-website; git submodule update --init --recursive;'
                git branch: env.BRANCH_NAME, credentialsId: '33c357dc-5f11-4930-9063-07bc866f7cff', url: 'https://github.com/GrowthJockey/intellsys-website.git'
            }
        }
    
        stage('Building image') {
            steps {
                script {
                    if (env.BRANCH_NAME == 'staging') {
                        withCredentials([usernamePassword(credentialsId: '9831574e-4c5c-4476-b75b-0924dfb662dd', passwordVariable: 'DockerCredentials', usernameVariable: 'DockerUser')]) { 
                            sh "docker login -u growthjockey -p ${DockerCredentials}"
                            sh "docker build --build-arg BASE_IMAGE=048578456468.dkr.ecr.ap-south-1.amazonaws.com/base-images:intellsys-stage -t intellsys-stage:latest ."
                            } 
                    }
                    else if (env.BRANCH_NAME == 'prod') {
                        withCredentials([usernamePassword(credentialsId: '9831574e-4c5c-4476-b75b-0924dfb662dd', passwordVariable: 'DockerCredentials', usernameVariable: 'DockerUser')]) {
                            sh "docker login -u growthjockey -p ${DockerCredentials}"
                            sh "docker build --build-arg BASE_IMAGE=048578456468.dkr.ecr.ap-south-1.amazonaws.com/base-images:intellsys-prod-final -t intellsys-prod:latest ."
                            } 
                    }
                }
            }
        }
        
        stage('Pushing to ECR') {
            steps{
                script {
                    if (env.BRANCH_NAME == 'staging') {
                        sh "docker tag intellsys-stage:latest 048578456468.dkr.ecr.ap-south-1.amazonaws.com/intellsys-stage:${env.BUILD_ID}"
                        sh "docker push 048578456468.dkr.ecr.ap-south-1.amazonaws.com/intellsys-stage:${env.BUILD_ID}"
                    } 

                    else if (env.BRANCH_NAME == 'prod') {
                        sh "docker tag intellsys-prod:latest 048578456468.dkr.ecr.ap-south-1.amazonaws.com/intellsys-prod:${env.BUILD_ID}"
                        sh "docker push 048578456468.dkr.ecr.ap-south-1.amazonaws.com/intellsys-prod:${env.BUILD_ID}"
                    }
                }
            }
        }
        
       stage('Docker') {
            steps {
                script {
                    if (env.BRANCH_NAME == 'staging') {
                        sshagent(['f74f1a2f-5c3d-49e4-a0e5-646f8d9e87ea'])  {
                            def commandOutput = sh(script: "ssh -o StrictHostKeyChecking=no ubuntu@ec2-13-126-188-129.ap-south-1.compute.amazonaws.com 'sudo docker ps -a | grep intellsys-fallback | wc -l'", returnStdout: true).trim()
                            def count = commandOutput.toInteger()
                            if (count == 1) {
                                sh """ssh -o StrictHostKeyChecking=no ubuntu@ec2-13-126-188-129.ap-south-1.compute.amazonaws.com 'sudo su'"""
                                sh """ssh -o StrictHostKeyChecking=no ubuntu@ec2-13-126-188-129.ap-south-1.compute.amazonaws.com 'sudo docker rm -f intellsys-fallback'"""
                            }  
                            else {
                                    echo "no container"
                            }
                        }
                    }
                    else if (env.BRANCH_NAME == 'prod') {
                        sshagent(['f74f1a2f-5c3d-49e4-a0e5-646f8d9e87ea']) {
                            def commandOutput = sh(script: "ssh -o StrictHostKeyChecking=no ubuntu@ec2-3-6-162-95.ap-south-1.compute.amazonaws.com 'sudo docker ps -a | grep intellsys-fallback | wc -l'", returnStdout: true).trim()
                            def count = commandOutput.toInteger()
                            if (count == 1) {
                                sh """ssh -o StrictHostKeyChecking=no ubuntu@ec2-3-6-162-95.ap-south-1.compute.amazonaws.com 'sudo su'"""
                                sh """ssh -o StrictHostKeyChecking=no ubuntu@ec2-3-6-162-95.ap-south-1.compute.amazonaws.com 'sudo docker rm -f intellsys-fallback'"""
                            }  else {
                                echo 'No containers found.'
                    }
                        
                }
            }    
        }
            }
 }
        
        stage('Deploy on k8') {
            steps {
              script{
                 if (env.BRANCH_NAME == 'staging') {
                    sshagent(['f74f1a2f-5c3d-49e4-a0e5-646f8d9e87ea'])  {
                        sh """ssh -o StrictHostKeyChecking=no ubuntu@ec2-13-126-188-129.ap-south-1.compute.amazonaws.com 'sudo docker pull intellsys-stage:latest 048578456468.dkr.ecr.ap-south-1.amazonaws.com/intellsys-stage:$BUILD_ID'"""
                        sh """ssh -o StrictHostKeyChecking=no ubuntu@ec2-13-126-188-129.ap-south-1.compute.amazonaws.com 'sudo docker run -d -p 3001:3000 --name intellsys-fallback intellsys-stage:latest 048578456468.dkr.ecr.ap-south-1.amazonaws.com/intellsys-stage:$BUILD_ID'"""
                        sh '''
                        ssh -o StrictHostKeyChecking=no ubuntu@ec2-13-126-188-129.ap-south-1.compute.amazonaws.com \
                        \'while [[ "$(curl -vL -s -o /dev/null -w "%{http_code}" localhost:3001)" -ne 200 ]]; do sleep 1; done\'
                        '''
                        sh """ssh -o StrictHostKeyChecking=no ubuntu@ec2-13-126-188-129.ap-south-1.compute.amazonaws.com 'sudo sed -i s~http://localhost:3000~http://localhost:3001~g /etc/nginx/sites-enabled/default'"""
                        sh """ssh -o StrictHostKeyChecking=no ubuntu@ec2-13-126-188-129.ap-south-1.compute.amazonaws.com 'sudo nginx -s reload'"""
                        sh """ssh -o StrictHostKeyChecking=no ubuntu@ec2-13-126-188-129.ap-south-1.compute.amazonaws.com 'sudo docker rm -f intellsys-container'"""
                        sh """ssh -o StrictHostKeyChecking=no ubuntu@ec2-13-126-188-129.ap-south-1.compute.amazonaws.com 'sudo docker run -d -p 3000:3000 --name intellsys-container intellsys-stage:latest 048578456468.dkr.ecr.ap-south-1.amazonaws.com/intellsys-stage:$BUILD_ID'"""
                        sh '''
                        ssh -o StrictHostKeyChecking=no ubuntu@ec2-13-126-188-129.ap-south-1.compute.amazonaws.com \
                        \'while [[ "$(curl -vL -s -o /dev/null -w "%{http_code}" localhost:3000)" -ne 200 ]]; do sleep 1; done\'
                        '''
                        sh """ssh -o StrictHostKeyChecking=no ubuntu@ec2-13-126-188-129.ap-south-1.compute.amazonaws.com 'sudo sed -i s~http://localhost:3001~http://localhost:3000~g /etc/nginx/sites-enabled/default'"""
                        sh """ssh -o StrictHostKeyChecking=no ubuntu@ec2-13-126-188-129.ap-south-1.compute.amazonaws.com 'sudo nginx -s reload'"""
                        sh """ssh -o StrictHostKeyChecking=no ubuntu@ec2-13-126-188-129.ap-south-1.compute.amazonaws.com 'sudo docker rm -f intellsys-fallback'"""
                            
                            } 
                    }
                else if (env.BRANCH_NAME == 'prod') {
                        sshagent(['f74f1a2f-5c3d-49e4-a0e5-646f8d9e87ea'])  {
                        sh """ssh -o StrictHostKeyChecking=no ubuntu@ec2-3-6-162-95.ap-south-1.compute.amazonaws.com 'sudo docker pull 048578456468.dkr.ecr.ap-south-1.amazonaws.com/intellsys-prod:$BUILD_ID'"""
                        sh """ssh -o StrictHostKeyChecking=no ubuntu@ec2-3-6-162-95.ap-south-1.compute.amazonaws.com 'sudo docker run -d -p 3001:3000 --name intellsys-fallback 048578456468.dkr.ecr.ap-south-1.amazonaws.com/intellsys-prod:$BUILD_ID'"""
                        sh '''
                        ssh -o StrictHostKeyChecking=no ubuntu@ec2-3-6-162-95.ap-south-1.compute.amazonaws.com \
                        \'while [[ "$(curl -vL -s -o /dev/null -w "%{http_code}" localhost:3001)" -ne 200 ]]; do sleep 1; done\'
                        '''
                        sh """ssh -o StrictHostKeyChecking=no ubuntu@ec2-3-6-162-95.ap-south-1.compute.amazonaws.com 'sudo sed -i s~http://localhost:3000~http://localhost:3001~g /etc/nginx/sites-enabled/default'"""
                        sh """ssh -o StrictHostKeyChecking=no ubuntu@ec2-3-6-162-95.ap-south-1.compute.amazonaws.com 'sudo nginx -s reload'"""
                        sh """ssh -o StrictHostKeyChecking=no ubuntu@ec2-3-6-162-95.ap-south-1.compute.amazonaws.com 'sudo docker rm -f intellsys-container'"""
                        sh """ssh -o StrictHostKeyChecking=no ubuntu@ec2-3-6-162-95.ap-south-1.compute.amazonaws.com 'sudo docker run -d -p 3000:3000 --name intellsys-container 048578456468.dkr.ecr.ap-south-1.amazonaws.com/intellsys-prod:$BUILD_ID'"""
                        sh '''
                        ssh -o StrictHostKeyChecking=no ubuntu@ec2-3-6-162-95.ap-south-1.compute.amazonaws.com \
                        \'while [[ "$(curl -vL -s -o /dev/null -w "%{http_code}" localhost:3000)" -ne 200 ]]; do sleep 1; done\'
                        '''
                        sh """ssh -o StrictHostKeyChecking=no ubuntu@ec2-3-6-162-95.ap-south-1.compute.amazonaws.com 'sudo sed -i s~http://localhost:3001~http://localhost:3000~g /etc/nginx/sites-enabled/default'"""
                        sh """ssh -o StrictHostKeyChecking=no ubuntu@ec2-3-6-162-95.ap-south-1.compute.amazonaws.com 'sudo nginx -s reload'"""
                        sh """ssh -o StrictHostKeyChecking=no ubuntu@ec2-3-6-162-95.ap-south-1.compute.amazonaws.com 'sudo docker rm -f intellsys-fallback'"""
                        }
                }


                            
                            //} 
                        //}
                //sh "sed -i s/TAG/${BUILD_ID}/g deployment.yml"
                //sshagent(['510bff66-357b-495d-b582-3bfa339135e6'])  {
                  //sh 'sudo yum install docker'
                  //sh 'aws ecr get-login-password --region ap-south-1 | docker login --username AWS --password-stdin 048578456468.dkr.ecr.ap-south-1.amazonaws.com' 
                  //sshagent(['b6cb4788-6567-401f-b5d8-afc6e0892118']) {
                    //sh 'sudo yum install docker'
                    //sh ' 
                  //sh 'sudo docker pull 048578456468.dkr.ecr.ap-south-1.amazonaws.com/growthjockey:158'
                  //sh 'sudo docker run -d -p 900:3000 --name livguard-container-demo 048578456468.dkr.ecr.ap-south-1.amazonaws.com/growthjockey:TAG'
                  //sh 'Docker pull 048578456468.dkr.ecr.ap-south-1.amazonaws.com/growthjockey:148'
                //sshagent(['5526d68b-d555-40e4-b64d-932a8439cfc1']) {
                //withKubeConfig(caCertificate: '', clusterName: 'minikube', contextName: 'minikube', credentialsId: '35abf961-eedc-4f3e-b8b7-5effb6ac90a6', namespace: 'default', restrictKubeConfigAccess: false, serverUrl: 'https://127.0.0.1:51883'){
                //sh 'kubectl apply -f deployment.yml --context=growthjockey@livguard.ap-south-1.eksctl.io'
                //withKubeConfig(caCertificate: '', clusterName: 'kube-master', contextName: '', credentialsId: '50cf6884-7b53-479d-b912-5dbc6808f9b8', namespace: '', restrictKubeConfigAccess: false, serverUrl: '') {
                    //sh 'curl -LO "https://storage.googleapis.com/kubernetes-release/release/v1.20.5/bin/linux/amd64/kubectl"'
                    //sh 'chmod u+x ./kubectl'
                    //sh 'sudo su - newUser'
               
               }
            }
}
    }
}
  
