"use client"
import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, Sparkles, Navigation } from 'lucide-react';
import Image from 'next/image';

const Custom404 = () => {
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                duration: 0.8,
                staggerChildren: 0.3
            }
        }
    };

    const itemVariants = {
        hidden: { y: 30, opacity: 0, scale: 0.9 },
        visible: {
            y: 0,
            opacity: 1,
            scale: 1,
            transition: {
                duration: 0.7,
            }
        }
    };

    const floatAnimation = {
        y: [-15, 15, -15],
        transition: {
            duration: 6,
            repeat: Infinity,
        }
    };

    const glowVariants = {
        initial: {
            boxShadow: "0 0 20px rgba(59, 130, 246, 0.3)",
            backgroundPosition: "0% 50%"
        },
        animate: {
            boxShadow: [
                "0 0 20px rgba(59, 130, 246, 0.3)",
                "0 0 40px rgba(59, 130, 246, 0.6)",
                "0 0 60px rgba(59, 130, 246, 0.4)",
                "0 0 20px rgba(59, 130, 246, 0.3)"
            ],
            backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
            transition: {
                duration: 4,
                repeat: Infinity,
            }
        }
    };

    const orbitVariants = {
        animate: {
            rotate: 360,
            transition: {
                duration: 20,
                repeat: Infinity,
            }
        }
    };

    const pulseVariants = {
        animate: {
            scale: [1, 1.05, 1],
            opacity: [0.7, 1, 0.7],
            transition: {
                duration: 3,
                repeat: Infinity,
            }
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-blue-900/20 dark:to-indigo-900/30 flex items-center justify-center p-4 transition-colors duration-500">
            {/* Background Animated Elements */}
            <motion.div
                className="absolute top-1/4 left-1/4 w-32 h-32 bg-blue-400/10 dark:bg-blue-600/10 rounded-full blur-xl"
                animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.3, 0.6, 0.3]
                }}
                transition={{
                    duration: 8,
                    repeat: Infinity,
                    ease: "easeInOut"
                }}
            />

            <motion.div
                className="absolute bottom-1/3 right-1/3 w-24 h-24 bg-purple-400/10 dark:bg-purple-600/10 rounded-full blur-xl"
                animate={{
                    scale: [1.2, 1, 1.2],
                    opacity: [0.4, 0.7, 0.4]
                }}
                transition={{
                    duration: 6,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: 2
                }}
            />

            <motion.div
                className="absolute top-1/3 right-1/4 w-16 h-16 bg-indigo-400/10 dark:bg-indigo-600/10 rounded-full blur-lg"
                variants={orbitVariants}
                animate="animate"
            />

            <motion.div
                className="w-full max-w-2xl relative z-10"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
            >
                <Card className="shadow-2xl bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-3xl overflow-hidden border border-white/20 dark:border-gray-700/30">
                    <CardContent className="p-12 text-center relative">
                        {/* Floating Particles */}
                        {[...Array(5)].map((_, i) => (
                            <motion.div
                                key={i}
                                className="absolute w-2 h-2 bg-blue-400/50 dark:bg-blue-600/50 rounded-full"
                                style={{
                                    top: `${20 + i * 15}%`,
                                    left: `${10 + i * 20}%`
                                }}
                                animate={{
                                    y: [0, -20, 0],
                                    x: [0, 15, 0],
                                    opacity: [0, 1, 0]
                                }}
                                transition={{
                                    duration: 4,
                                    repeat: Infinity,
                                    delay: i * 0.5,
                                    ease: "easeInOut"
                                }}
                            />
                        ))}

                        {/* Animated 404 Number */}
                        <motion.div
                            className="mb-8 relative"
                            variants={itemVariants}
                            animate={floatAnimation}
                        >
                            <motion.h1
                                className="text-8xl md:text-9xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 dark:from-blue-400 dark:via-purple-400 dark:to-indigo-400 bg-clip-text text-transparent"
                                variants={glowVariants}
                                initial="initial"
                                animate="animate"
                            >
                                404
                            </motion.h1>
                            <motion.div
                                className="absolute -top-4 -right-4"
                                animate={{ rotate: 360 }}
                                transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                            >
                                <Sparkles className="w-8 h-8 text-yellow-400" />
                            </motion.div>
                        </motion.div>

                        {/* Error Message */}
                        <motion.div variants={itemVariants} className="mb-8">
                            <h2 className="text-3xl md:text-4xl font-semibold text-gray-800 dark:text-gray-100 mb-4">
                                Lost in the Digital Cosmos
                            </h2>
                            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-md mx-auto leading-relaxed">
                                {`The page you're seeking has embarked on an interstellar journey. 
                                While we track it down, let's get you back to familiar space.`}
                            </p>
                        </motion.div>

                        {/* Animated Illustration */}

                        <motion.div
                            className="mb-8"
                            variants={itemVariants}
                        >
                            <motion.div
                                className="w-40 h-40 mx-auto mb-6 bg-gradient-to-br from-orange-400 to-orange-600 dark:from-orange-500 dark:to-orange-700 rounded-3xl flex items-center justify-center shadow-[0_0_40px_rgba(249,115,22,0.6)]"
                                whileHover={{
                                    scale: 1.05,
                                    rotate: 5,
                                    boxShadow: "0 0 60px rgba(249,115,22,0.9)" // brighter on hover
                                }}
                                animate={{
                                    rotate: [0, 5, -5, 0],
                                    y: [0, -10, 0],
                                    boxShadow: [
                                        "0 0 30px rgba(249,115,22,0.5)",
                                        "0 0 50px rgba(249,115,22,0.8)",
                                        "0 0 30px rgba(249,115,22,0.5)"
                                    ]
                                }}
                                transition={{
                                    duration: 8,
                                    repeat: Infinity,
                                    ease: "easeInOut"
                                }}
                            >
                                <Image
                                    src="/logo.png"
                                    alt="Logo"
                                    width={80}
                                    height={80}
                                    className="object-contain drop-shadow-[0_0_10px_rgba(249,115,22,0.8)]"
                                    priority
                                />
                            </motion.div>
                        </motion.div>


                        {/* Action Buttons */}
                        <motion.div
                            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
                            variants={itemVariants}
                        >
                            <motion.div
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className="w-full sm:w-auto"
                            >
                                <Button
                                    variant="outline"
                                    size="lg"
                                    className="w-full border-2 border-gray-300 dark:border-gray-600 hover:border-blue-500 dark:hover:border-blue-400 px-8 py-3 rounded-full transition-all duration-300 group bg-transparent dark:bg-transparent"
                                    onClick={() => window.history.back()}
                                >
                                    <motion.div
                                        animate={{ x: [-5, 0, -5] }}
                                        transition={{ duration: 2, repeat: Infinity }}
                                        className="flex items-center"
                                    >
                                        <ArrowLeft className="w-5 h-5 mr-2" />
                                        <span>Retrace Steps</span>
                                    </motion.div>
                                </Button>
                            </motion.div>
                        </motion.div>

                        {/* Decorative Elements */}
                        <motion.div
                            className="absolute -top-8 -left-8 w-32 h-32 bg-blue-200/30 dark:bg-blue-600/20 rounded-full"
                            variants={pulseVariants}
                            animate="animate"
                        />

                        <motion.div
                            className="absolute -bottom-8 -right-8 w-28 h-28 bg-purple-200/30 dark:bg-purple-600/20 rounded-full"
                            variants={pulseVariants}
                            animate="animate"
                        />

                        <motion.div
                            className="absolute top-12 right-12"
                            animate={{ rotate: 360 }}
                            transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                        >
                            <Navigation className="w-6 h-6 text-blue-400 dark:text-blue-300" />
                        </motion.div>
                    </CardContent>
                </Card>

                {/* Footer Text */}
                <motion.p
                    className="text-center text-gray-500 dark:text-gray-400 mt-6 text-sm"
                    variants={itemVariants}
                >
                    Error Code: 404 • Page Not Found • Navigating the unknown
                </motion.p>
            </motion.div>
        </div>
    );
};

export default Custom404;