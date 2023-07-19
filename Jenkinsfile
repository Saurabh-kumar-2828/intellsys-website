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
                            sh "docker build --build-arg BASE_IMAGE=048578456468.dkr.ecr.ap-south-1.amazonaws.com/intellsys-stage:latest -t intellsys-stage:latest ."
                            } 
                    }
                    else if (env.BRANCH_NAME == 'prod') {
                        withCredentials([usernamePassword(credentialsId: '9831574e-4c5c-4476-b75b-0924dfb662dd', passwordVariable: 'DockerCredentials', usernameVariable: 'DockerUser')]) {
                            sh "docker login -u growthjockey -p ${DockerCredentials}"
                            sh "docker build  --build-arg BASE_IMAGE=048578456468.dkr.ecr.ap-south-1.amazonaws.com/intellsys-prod:base -t intellsys:latest ."
                            } 
                    }
                }
            }
        }
        
        //stage('Pushing to ECR') {
            //steps{
                //script {
                    //if (env.BRANCH_NAME == 'staging') {
                        //sh "docker tag growthjockey-stage:latest 048578456468.dkr.ecr.ap-south-1.amazonaws.com/intellsys-stage:${env.BUILD_ID}"
                        //sh "docker push 048578456468.dkr.ecr.ap-south-1.amazonaws.com/intellsys-stage:${env.BUILD_ID}"
                    //} 

                    //else if (env.BRANCH_NAME == 'prod') {
                        //sh "docker tag growthjockey-prod:latest 048578456468.dkr.ecr.ap-south-1.amazonaws.com/intellsys-prod:${env.BUILD_ID}"
                        //sh "docker push 048578456468.dkr.ecr.ap-south-1.amazonaws.com/intellsys-prod:${env.BUILD_ID}"
                    //}
                //}
            //}
        //}
        
       //stage('Docker') {
            //steps {
                //script {
                    //if (env.BRANCH_NAME == 'staging') {
                        //sshagent(['0b24b3d1-83bf-4849-a1d6-0f44be00f76b'])  {
                            //def dockerPsOutput = sh(returnStdout: true, script: """ssh -o StrictHostKeyChecking=no ubuntu@ec2-13-200-72-145.ap-south-1.compute.amazonaws.com 'sudo docker ps -aq'""")
                            //if (dockerPsOutput.trim()) {
                                //sh """ssh -o StrictHostKeyChecking=no ubuntu@ec2-13-200-72-145.ap-south-1.compute.amazonaws.com 'sudo su'"""
                                //sh """ssh -o StrictHostKeyChecking=no ubuntu@ec2-13-200-72-145.ap-south-1.compute.amazonaws.com 'sudo docker rm -f \$(sudo docker ps -aq)'"""
                            //}  else {
                                //echo 'No containers found.'
                    //}
                        //}
                    //}
                    //else if (env.BRANCH_NAME == 'prod') {
                        //sshagent(['085b53a5-a741-47a5-b931-df84bb49fd62']) {
                            //def dockerPsOutput = sh(returnStdout: true, script: """ssh -o StrictHostKeyChecking=no ubuntu@ec2-3-110-15-54.ap-south-1.compute.amazonaws.com 'sudo docker ps -aq'""")
                            //if (dockerPsOutput.trim()) {
                                //sh """ssh -o StrictHostKeyChecking=no ubuntu@ec2-3-110-15-54.ap-south-1.compute.amazonaws.com 'sudo su'"""
                                //sh """ssh -o StrictHostKeyChecking=no ubuntu@ec2-3-110-15-54.ap-south-1.compute.amazonaws.com 'sudo docker rm -f \$(sudo docker ps -aq)'"""
                            //}  else {
                                //echo 'No containers found.'
                    //}
                        
                //}
            //}    
        //}
            //}
 //}
        
        //stage('Deploy on k8') {
            //steps {
              //script{
                 //if (env.BRANCH_NAME == 'staging') {
                    //sshagent(['0b24b3d1-83bf-4849-a1d6-0f44be00f76b'])  {
                        //sh """ssh -o StrictHostKeyChecking=no ubuntu@ec2-13-200-72-145.ap-south-1.compute.amazonaws.com 'sudo su'"""
                        //sh """ssh -o StrictHostKeyChecking=no ubuntu@ec2-13-200-72-145.ap-south-1.compute.amazonaws.com 'sudo docker login'"""
                        //sh """ssh -o StrictHostKeyChecking=no ubuntu@ec2-13-200-72-145.ap-south-1.compute.amazonaws.com 'sudo docker ps -a'"""
                        //sh """ssh -o StrictHostKeyChecking=no ubuntu@ec2-13-200-72-145.ap-south-1.compute.amazonaws.com 'sudo docker pull 048578456468.dkr.ecr.ap-south-1.amazonaws.com/growthjockey-stage:$BUILD_ID'"""
                        //sh """ssh -o StrictHostKeyChecking=no ubuntu@ec2-13-200-72-145.ap-south-1.compute.amazonaws.com 'sudo docker run -d -p 3000:3000 --name growthjockey-container 048578456468.dkr.ecr.ap-south-1.amazonaws.com/growthjockey-stage:$BUILD_ID'"""
                            
                            //} 
                    //}
                //else if (env.BRANCH_NAME == 'prod') {
                        //sshagent(['085b53a5-a741-47a5-b931-df84bb49fd62'])  {
                            //sh """ssh -o StrictHostKeyChecking=no ubuntu@ec2-3-110-15-54.ap-south-1.compute.amazonaws.com 'sudo su'"""
                            //sh """ssh -o StrictHostKeyChecking=no ubuntu@ec2-3-110-15-54.ap-south-1.compute.amazonaws.com 'sudo docker rm -f \$(sudo docker ps -aq)'"""
                            //sh """ssh -o StrictHostKeyChecking=no ubuntu@ec2-3-110-15-54.ap-south-1.compute.amazonaws.com 'sudo docker pull 048578456468.dkr.ecr.ap-south-1.amazonaws.com/growthjockey-prod:$BUILD_ID'"""
                            //sh """ssh -o StrictHostKeyChecking=no ubuntu@ec2-3-110-15-54.ap-south-1.compute.amazonaws.com 'sudo docker run -d -p 3000:3000 --name growthjockey-container-$BUILD_ID 048578456468.dkr.ecr.ap-south-1.amazonaws.com/growthjockey-prod:$BUILD_ID'"""
                        //}
                //}


                            
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
  
