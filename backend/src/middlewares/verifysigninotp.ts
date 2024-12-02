import express from 'express';
import { prisma } from '../../prisma/prisma';
import bcrypt from 'bcrypt'

const verifysigninotp = async(req: express.Request, res: express.Response, next: express.NextFunction) => {

    const { otp, email } = req.body;
    
    if( !email) {
        res.status(400).json({ message : "email is required"});
        return;
    }
    if(!otp) {
        res.status(400).json({ message : "otp is required"});
        return;
    }

    try {
        const user = await prisma.otp.findUnique({
            where : {
                email
            }
        });

        if(!user){
           res.status(404).json({ message : "user not found"});
           return;
        }

        if(user?.expiresIn < new Date()){
            //@ts-ignore
            const expires = Math.floor(new Date() - new Date(user?.expiresIn) / 1000);
            res.status(401).json({ message : `otp expired ${expires} sec ago` });   

            await prisma.otp.delete({
                where : {email}
            })
            return; 
        }

        const hashedotp = await bcrypt.compare(otp, user?.otpHash);

        if(!hashedotp){
            res.status(401).json({ message : "Incorrect otp" });
            return;
        }

        next();
    }
    catch(e){
        console.log(e);
    }
}

export default verifysigninotp