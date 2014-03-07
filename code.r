setwd("/Applications/AMPPS/www/MDEV")
setwd("/Applications/AMPPS/www/MDEV")

RR=0.4
n=5

AIG=read.table("AIG_05-09.csv", sep=",", header=T)
BAC=read.table("BAC_05-09.csv", sep=",", header=T)
GS=read.table("GS_05-09.csv", sep=",", header=T)
JPM=read.table("JPM_05-09.csv", sep=",", header=T)
MS=read.table("MS_05-09.csv", sep=",", header=T)

# dat: data frame from reading the csv file
process_data=function(dat)
{
	dat=dat[,c(1,2,4,6)]
	names(dat)=c("Date", "CDS", "Equity price", "Market Cap")
	return(dat)
}

AIG=process_data(AIG)
BAC=process_data(BAC)
GS=process_data(GS)
JPM=process_data(JPM)
MS=process_data(MS)


# RR: Rate of Recovery
# n: number of years to maturity of CDS contract
# X: CDS spread data (time series a)
iPoD=function(RR, n, X)
{
	pod=1-(1-(X/10000)/(1-RR))^n
	return(pod)
}

AIG.pod=iPoD(RR, n, AIG[,2])
BAC.pod=iPoD(RR, n, BAC[,2])
GS.pod=iPoD(RR, n, GS[,2])
JPM.pod=iPoD(RR, n, JPM[,2])
MS.pod=iPoD(RR, n, MS[,2])

# now, convert the asset returns to log asset returns
log_returns=function(X)
{
	nn=length(X)
	ret=log(X[-1]/X[-nn])
	return(ret)
}

AIG.logr=log_returns(AIG[,3])
BAC.logr=log_returns(BAC[,3])
GS.logr=log_returns(GS[,3])
JPM.logr=log_returns(JPM[,3])
MS.logr=log_returns(MS[,3])

# Segoviano 2006 seems use positive values for a loss rather than negative
# The formula (A.49) is wrong to use small phi rather than capital Phi!!!
default_barrier=function(pod)
{
	qnorm(mean(pod))
}

xd=c(
default_barrier(AIG.pod),
default_barrier(BAC.pod),
default_barrier(GS.pod),
default_barrier(JPM.pod),
default_barrier(MS.pod))

# now solve the linear system using one of the packages and we are done!!!

# NN is the number of banks
NN=5
#NN=2

# evaluate all possible integrals
library(mvtnorm)
library(rootSolve)

# const: the constant on the RHS
# N: number of banks
# params: u, l1, l2, ..., lN
f=function(params, N, const)
{
    u=params[1]
    lambdas=params[-1]

    val=0
    for (k in 1:N)
    {
	S=combn(N, k)
	nperm=dim(S)[2]
	for (j in 1:nperm)
	{
	    ll=xd[1:N]
	    uu=rep(Inf, N)
	    # S[,j] are in
	    ll[S[,j]]=-Inf
	    uu[S[,j]]=xd[S[,j]]
	    c=k*pmvnorm(ll, uu)
	    sm=sum(lambdas[S[,j]])
	    val=val+c[1]*exp(-(1+u+sm))
	}
    }

    val = val - const

    val
}


T=length(AIG.pod)

yy=c(AIG.pod[T],
BAC.pod[T],
GS.pod[T],
JPM.pod[T],
MS.pod[T])

# no way to make it work using only optim?
params=rep(1, 1+NN)
cc=sum(yy[1:NN])+1
#optim(par=params, fn=f, N=NN, const=cc)

g=function(params, N, const)
{
    u=params[1]
    lambdas=params[-1]

    vals=rep(0, N+1)
    for (k in 1:N)
    {
        S=combn(N, k)
        nperm=dim(S)[2]
        for (j in 1:nperm)
        {
            ll=xd[1:N]
            uu=rep(Inf, N)
            # S[,j] are in
            ll[S[,j]]=-Inf
            uu[S[,j]]=xd[S[,j]]
            c=pmvnorm(ll, uu)
            sm=sum(lambdas[S[,j]])
            for (l in S[,j])
            {
                vals[l]=vals[l]+c[1]*exp(-(1+u+sm))
            }
            vals[N+1]=vals[N+1]+c[1]*exp(-(1+u+sm))
        }
    }

    c=pmvnorm(xd[1:N], rep(Inf,N))
    vals[N+1]=vals[N+1]+c[1]*exp(-(1+u))

    vals = vals - const

    vals
}

# starting values matter - for example, if we use rep(1, NN+1) as the starting values - the root is not found
params=rep(-1, NN+1)
cc=c(yy[1:NN], 1)
ans=multiroot(f=g, start=params, N=NN, const=cc)

mu<-ans$root[1]
lambdas<-ans$root[-1]

ddm<-function(i, j, xd, mu, lambdas) {

    N<-length(xd)
    ll<-rep(-Inf, N)
    uu<-rep(Inf, N)

    uu[c(i,j)]<-xd[c(i, j)]

    set<-seq(1, N, 1)[-c(i, j)]
    N_set<-length(set)

    const<-sum(lambdas[c(i,j)])+mu

    joint_pr<-0
    for (k in 1:N_set) {
        S=combn(N_set, k)
        nperm=dim(S)[2]
	for (l in 1:nperm) {
	    index<-set[S[,l]]
	    #print(index)
	    C<-const+sum(lambdas[index])

	    uu_temp<-uu
	    uu_temp[index]<-xd[index]

	    not_index<-set[-S[,l]]
	    ll_temp<-ll
	    ll_temp[not_index]<-xd[not_index]

	    pr<-exp(-C)*pmvnorm(ll_temp, uu_temp)
	    #print(pr[1])
	    joint_pr<-joint_pr + pr[1]
	}
    }

    ll<-rep(-Inf, N)
    uu<-rep(Inf, N)

    uu[j]<-xd[j]

    set<-seq(1, N, 1)[-j]
    N_set<-length(set)

    const<-sum(lambdas[j])+mu

    marg_pr<-0
    for (k in 1:N_set) {
	S=combn(N_set, k)
	nperm=dim(S)[2]
	for (l in 1:nperm) {
	    index<-set[S[,l]]
	    #print(index)
	    C<-const+sum(lambdas[index])

	    uu_temp<-uu
	    uu_temp[index]<-xd[index]

	    not_index<-set[-S[,l]]
	    ll_temp<-ll
	    ll_temp[not_index]<-xd[not_index]

	    pr<-exp(-C)*pmvnorm(ll_temp, uu_temp)
	    #print(pr[1])
	    marg_pr<-marg_pr + pr[1]
	}
    }

    return(joint_pr/marg_pr)
}

# test the function
ddm(1, 2, xd, mu, lambdas)
ddm(2, 1, xd, mu, lambdas)

# fill in the matrix
ddm_matrix<-matrix(0, NN, NN)

for (i in 1:NN) {
    for (j in 1:NN) {
	if (i != j) {
	    ddm_matrix[i, j]<-ddm(i, j, xd, mu, lambdas)
	}
	if (i == j) {
	    ddm_matrix[i, j]<-1
	}
    }
}

# entry (i, j) is defined as the conditional prob of bank i being distressed given that bank j has already been distressed
# so entry (1, 2) indicates the probability that AIG is under distress given that BAC is under distress
# and entry (2, 1) indicates the probability that BAC is under distress given that AIG is under distress
ddm_matrix<-as.data.frame(ddm_matrix)
colnames(ddm_matrix)<-c("AIG", "BAC", "GS", "JPM", "MS")
rownames(ddm_matrix)<-c("AIG", "BAC", "GS", "JPM", "MS")

write.csv(ddm_matrix, file="/Applications/AMPPS/www/MDEV/data/sample1/ddm.csv", row.names=F)

# indep estimates
# read the static data in
dat<-read.csv("static1.csv", header=T)
dat1<-read.csv("static2.csv", header=T)
dat$holdings<-yy
dat2<-merge(dat,dat1)
write.csv(dat2, file="/Applications/AMPPS/www/MDEV/data/sample1/pod1.csv", row.names=F)
write.csv(dat2, file="/Applications/AMPPS/www/MDEV/data/sample1/mdesample.csv", row.names=F)


marginalize<-function(j, xd, mu, lambdas, N) {
    # marginalize the MDEV for bank j
    ll<-rep(-Inf, N)
    uu<-rep(Inf, N)

    uu[j]<-xd[j]

    set<-seq(1, N, 1)[-j]
    N_set<-length(set)

    const<-sum(lambdas[j])+mu

    marg_pr<-0
    for (k in 1:N_set) {
	S=combn(N_set, k)
	nperm=dim(S)[2]
	for (l in 1:nperm) {
	    index<-set[S[,l]]
	    #print(index)
	    C<-const+sum(lambdas[index])

	    uu_temp<-uu
	    uu_temp[index]<-xd[index]

	    not_index<-set[-S[,l]]
	    ll_temp<-ll
	    ll_temp[not_index]<-xd[not_index]

	    pr<-exp(-C)*pmvnorm(ll_temp, uu_temp)
	    #print(pr[1])
	    marg_pr<-marg_pr + pr[1]
	}
    }
    return(marg_pr)
}

zz<-rep(0, NN)
zz[1]<-marginalize(1, xd, mu, lambdas, NN) 
zz[2]<-marginalize(2, xd, mu, lambdas, NN) 
zz[3]<-marginalize(3, xd, mu, lambdas, NN) 
zz[4]<-marginalize(4, xd, mu, lambdas, NN) 
zz[5]<-marginalize(5, xd, mu, lambdas, NN) 

zz<-as.data.frame(zz)
colnames(zz)<-"PoD"
rownames(zz)<-c("AIG", "BAC", "GS", "JPM", "MS")
write.csv(zz, file="/Applications/AMPPS/www/MDEV/data/sample1/pod2.csv", col.names=F)

